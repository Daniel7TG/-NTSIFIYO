import TeacherReportService, { reportFilters, reportQuery } from './TeacherReportService';

const json = (data, status = 200) => ({
    ok: status >= 200 && status < 300, status,
    headers: { get: name => name.toLowerCase() === 'content-type' ? 'application/json' : null },
    text: jest.fn(async () => JSON.stringify(data)), json: jest.fn(async () => data),
});
const binary = (type = 'application/pdf', disposition = '') => ({
    ok: true, status: 200,
    headers: { get: name => ({ 'content-type': type, 'content-disposition': disposition })[name.toLowerCase()] },
    blob: jest.fn(async () => new Blob(['%PDF-binary\x00\xff'], { type })),
    text: jest.fn(() => { throw new Error('Binary download must not be decoded as text'); }),
});

beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.setItem('authToken', 'teacher-test-token');
});
afterEach(() => { jest.restoreAllMocks(); localStorage.clear(); });

test('filters preserve score zero and distinguish game/activity while repeating students', () => {
    const input = { groupId: 2, gameId: 15, activityId: 18, studentIds: ['student a', 'student-b'], minScore: 0, page: 0, size: 10, status: 'ALL', topic: '', irrelevant: 'ignore' };
    const query = new URLSearchParams(reportQuery(input));
    expect(query.getAll('studentIds')).toEqual(['student a', 'student-b']);
    expect(query.get('minScore')).toBe('0');
    expect(query.get('gameId')).toBe('15');
    expect(query.get('activityId')).toBe('18');
    expect(query.has('status')).toBe(false);
    expect(query.has('irrelevant')).toBe(false);
    expect(reportFilters(input, { pagination: false })).not.toHaveProperty('page');
    expect(reportFilters(input, { pagination: false })).not.toHaveProperty('size');
});

test('export includes applied filters and answer details but exports all matching pages', async () => {
    fetch.mockResolvedValue(json({ exportId: 7, status: 'PENDING' }, 202));
    await TeacherReportService.requestExport({ groupId: 2, gameId: 15, studentIds: ['student-a'], minScore: 0, attemptSelection: 'BEST', page: 3, size: 1 }, 'CSV');
    const [url, options] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/teacher\/reports\/exports$/);
    expect(options.headers.Authorization).toBe('Bearer teacher-test-token');
    expect(JSON.parse(options.body)).toEqual({ format: 'CSV', filters: { groupId: 2, gameId: 15, studentIds: ['student-a'], minScore: 0, attemptSelection: 'BEST', includeDetails: true } });
});

test('download keeps binary bytes, authenticates and decodes the attachment filename', async () => {
    const response = binary('application/pdf', "attachment; filename*=UTF-8''reporte%20mazahua%20%C3%B1.pdf");
    fetch.mockResolvedValue(response);
    const result = await TeacherReportService.downloadExport(7);
    expect(result.filename).toBe('reporte mazahua ñ.pdf');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(response.text).not.toHaveBeenCalled();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer teacher-test-token');
});

test('rejects a successful HTML proxy page instead of downloading it as a report', async () => {
    fetch.mockResolvedValue(binary('text/html'));
    await expect(TeacherReportService.downloadExport(7)).rejects.toThrow('archivo de reporte válido');
});

test('an HTML proxy response cannot be mistaken for an empty attempt history', async () => {
    fetch.mockResolvedValue(binary('text/html'));
    await expect(TeacherReportService.getAttemptHistory(18)).rejects.toThrow('datos válidos');
});

test('unauthorized downloads follow the shared expired-session handling', async () => {
    const event = jest.fn(); window.addEventListener('sessionUnauthorized', event);
    fetch.mockResolvedValue(json({ message: 'Sesión expirada' }, 401));
    await expect(TeacherReportService.downloadExport(7)).rejects.toMatchObject({ status: 401 });
    expect(event).toHaveBeenCalledTimes(1);
    expect(event.mock.calls[0][0].detail.token).toBe('teacher-test-token');
    window.removeEventListener('sessionUnauthorized', event);
});

test('polls the export until ready and downloads only from the authenticated API path', async () => {
    fetch.mockResolvedValueOnce(json({ exportId: 7, status: 'PENDING' }, 202))
        .mockResolvedValueOnce(json({ exportId: 7, status: 'PROCESSING' }))
        .mockResolvedValueOnce(json({ exportId: 7, status: 'READY', downloadPath: 'https://untrusted.invalid/file' }))
        .mockResolvedValueOnce(binary('text/csv; charset=UTF-8'));
    const onStatus = jest.fn();
    const result = await TeacherReportService.exportReport({ groupId: 2 }, 'CSV', { pollIntervalMs: 1, onStatus });
    expect(result.filename).toBe('reporte-del-grupo.csv');
    expect(result.exportId).toBe(7);
    expect(onStatus.mock.calls.map(([job]) => job.status)).toEqual(['PENDING', 'PROCESSING', 'READY']);
    expect(fetch.mock.calls[3][0]).toMatch(/\/api\/teacher\/reports\/exports\/7\/download$/);
});

test.each([
    ['FAILED', 'No se pudo generar'], ['EXPIRED', 'expiró'], ['INVALID', 'desconocido'],
])('stops and surfaces export status %s', async (status, message) => {
    fetch.mockResolvedValue(json({ exportId: 7, status }));
    await expect(TeacherReportService.exportReport({ groupId: 2 }, 'PDF')).rejects.toThrow(message);
    expect(fetch).toHaveBeenCalledTimes(1);
});

test('cancellation stops polling and does not download the file', async () => {
    const controller = new AbortController();
    fetch.mockResolvedValue(json({ exportId: 7, status: 'PENDING' }));
    await expect(TeacherReportService.exportReport({ groupId: 2 }, 'CSV', {
        signal: controller.signal, onStatus: () => controller.abort(),
    })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledTimes(1);
});

test('a deadline aborts a stalled request and gives a useful error', async () => {
    let requestSignal;
    fetch.mockImplementation((url, { signal }) => {
        requestSignal = signal;
        return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
    });
    await expect(TeacherReportService.exportReport({ groupId: 2 }, 'PDF', { timeoutMs: 10 })).rejects.toThrow('tardando demasiado');
    expect(requestSignal.aborted).toBe(true);
});

test('attempt details use individual activity and attempt identifiers', async () => {
    fetch.mockResolvedValue(json({ attemptId: 19, activityId: 18 }));
    await TeacherReportService.getAttempt(18, 19);
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/activities\/18\/attempts\/19$/);
});
