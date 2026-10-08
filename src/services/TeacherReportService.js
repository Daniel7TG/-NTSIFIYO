import apiConfig from './apiConfig';

const BASE = '/api/teacher/reports';
const FILTER_KEYS = new Set([
    'groupId', 'studentIds', 'fromDate', 'toDate', 'activityId', 'gameId', 'topic',
    'difficulty', 'gameType', 'source', 'status', 'minScore', 'maxScore',
    'minActivities', 'attemptSelection', 'page', 'size', 'sort', 'direction',
]);

// Keep zero-valued score/page filters and repeat studentIds in the query string.
export function reportFilters(filters = {}, { pagination = true } = {}) {
    return Object.fromEntries(Object.entries(filters).filter(([key, value]) =>
        FILTER_KEYS.has(key) && (pagination || !['page', 'size'].includes(key))
        && value !== undefined && value !== null && value !== '' && value !== 'ALL'
        && (!Array.isArray(value) || value.length > 0),
    ).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]));
}

export function reportQuery(filters) {
    const query = new URLSearchParams();
    Object.entries(reportFilters(filters)).forEach(([key, value]) => {
        (Array.isArray(value) ? value : [value]).forEach(item => query.append(key, item));
    });
    return query.toString();
}

async function request(endpoint, { signal, method = 'GET', body, binary = false, format } = {}) {
    const headers = apiConfig.getHeaders();
    if (body === undefined) delete headers['Content-Type'];
    const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
        method, headers, signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // Share the application's 401 handling without consuming successful binary downloads as text.
    if (!response.ok) return apiConfig.handleResponse(response, headers.Authorization?.slice(7));
    if (!binary) {
        if (!/application\/json/i.test(response.headers.get('content-type') || '')) {
            throw new Error('El servidor no devolvió datos válidos del reporte. Vuelve a intentarlo.');
        }
        const data = await apiConfig.handleResponse(response, headers.Authorization?.slice(7));
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('El servidor no devolvió datos válidos del reporte. Vuelve a intentarlo.');
        }
        return data;
    }
    const type = response.headers.get('content-type') || '';
    if (!/^(application\/pdf|text\/csv)(?:;|$)/i.test(type)) {
        throw new Error('El servidor no devolvió un archivo de reporte válido.');
    }
    const disposition = response.headers.get('content-disposition') || '';
    const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    let filename = /filename="([^"]+)"/i.exec(disposition)?.[1];
    if (encodedName) { try { filename = decodeURIComponent(encodedName); } catch { /* Use fallback below. */ } }
    const extension = /pdf/i.test(type) || format === 'PDF' ? 'pdf' : 'csv';
    filename = (filename || `reporte-del-grupo.${extension}`).replace(/[\x00-\x1f\x7f/\\]/g, '_');
    return { blob: await response.blob(), filename };
}

function aborted() { return new DOMException('La descarga fue cancelada.', 'AbortError'); }

function pause(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal.aborted) { reject(aborted()); return; }
        const onAbort = () => { clearTimeout(timer); reject(aborted()); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
        signal.addEventListener('abort', onAbort, { once: true });
    });
}

const TeacherReportService = {
    getOverview: (filters, options = {}) => request(`${BASE}/overview?${reportQuery(filters)}`, options),
    getStudents: (filters, options = {}) => request(`${BASE}/students?${reportQuery(filters)}`, options),
    getActivities: (filters, options = {}) => request(`${BASE}/activities?${reportQuery(filters)}`, options),
    getAttemptHistory: (activityId, options = {}) => request(`/api/activities/${encodeURIComponent(activityId)}/attempts`, options),
    getAttempt: (activityId, attemptId, options = {}) => request(`/api/activities/${encodeURIComponent(activityId)}/attempts/${encodeURIComponent(attemptId)}`, options),
    requestExport: (filters, format, { signal, includeDetails = true } = {}) => request(`${BASE}/exports`, {
        method: 'POST', signal,
        body: { filters: { ...reportFilters(filters, { pagination: false }), includeDetails }, format },
    }),
    getExportStatus: (exportId, options = {}) => request(`${BASE}/exports/${encodeURIComponent(exportId)}`, options),
    downloadExport: (exportId, options = {}) => request(`${BASE}/exports/${encodeURIComponent(exportId)}/download`, { ...options, binary: true }),

    async exportReport(filters, format, { signal, onStatus, includeDetails = true, timeoutMs = 90000, pollIntervalMs = 1000 } = {}) {
        const controller = new AbortController();
        const cancel = () => controller.abort();
        if (signal?.aborted) throw aborted();
        signal?.addEventListener('abort', cancel, { once: true });
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
        try {
            let job = await TeacherReportService.requestExport(filters, format, { signal: controller.signal, includeDetails });
            if (!job?.exportId) throw new Error('El servidor no identificó la exportación.');
            const exportId = job.exportId;
            for (;;) {
                onStatus?.(job);
                if (job.status === 'READY') {
                    const file = await TeacherReportService.downloadExport(exportId, { signal: controller.signal, format });
                    return { ...file, exportId };
                }
                if (job.status === 'FAILED') throw new Error('No se pudo generar el reporte. Intenta exportarlo de nuevo.');
                if (job.status === 'EXPIRED') throw new Error('La exportación expiró. Genera un nuevo reporte.');
                if (!['PENDING', 'PROCESSING'].includes(job.status)) throw new Error('El servidor devolvió un estado de exportación desconocido.');
                await pause(pollIntervalMs, controller.signal);
                job = await TeacherReportService.getExportStatus(exportId, { signal: controller.signal });
            }
        } catch (error) {
            if (timedOut) throw new Error('El reporte está tardando demasiado. Vuelve a intentar la descarga más tarde.');
            throw error;
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', cancel);
        }
    },
};

export default TeacherReportService;
