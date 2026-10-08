import React, { useEffect, useRef, useState } from 'react';
import TeacherReportService from '../../services/TeacherReportService';

export default function ReportExportButtons({ filters, disabled = false, includeDetails = true }) {
    const [format, setFormat] = useState(null);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const pending = useRef(null);
    useEffect(() => () => pending.current?.abort(), []);

    const start = async (nextFormat) => {
        if (pending.current || disabled || !filters?.groupId) return;
        const controller = new AbortController();
        pending.current = controller;
        setFormat(nextFormat); setError(''); setStatus('Preparando el reporte…');
        try {
            const file = await TeacherReportService.exportReport(filters, nextFormat, {
                signal: controller.signal, includeDetails,
                onStatus: (job) => {
                    if (!controller.signal.aborted) setStatus(job.status === 'READY' ? 'Descargando el archivo…' : 'Generando el reporte…');
                },
            });
            if (controller.signal.aborted) return;
            const url = URL.createObjectURL(file.blob);
            const link = document.createElement('a');
            link.href = url; link.download = file.filename;
            document.body.appendChild(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setStatus(`Reporte ${nextFormat} descargado.`);
        } catch (cause) {
            if (controller.signal.aborted) return;
            setStatus('');
            setError(cause.message || 'No se pudo descargar el reporte.');
        } finally {
            if (!controller.signal.aborted) { pending.current = null; setFormat(null); }
        }
    };

    const cancel = () => {
        pending.current?.abort(); pending.current = null;
        setFormat(null); setStatus('Descarga cancelada.'); setError('');
    };

    return (
        <div className="space-y-2 print:hidden">
            <div className="flex flex-wrap gap-2">
                {['CSV', 'PDF'].map(value => <button key={value} type="button" onClick={() => start(value)}
                    disabled={disabled || !filters?.groupId || Boolean(format)}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
                    {format === value ? `Preparando ${value}…` : `Descargar ${value}`}
                </button>)}
                {format && <button type="button" onClick={cancel} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700">Cancelar descarga</button>}
            </div>
            {status && <p role="status" className="text-sm">{status}</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
    );
}
