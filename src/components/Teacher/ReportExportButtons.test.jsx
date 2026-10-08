import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ReportExportButtons from './ReportExportButtons';
import TeacherReportService from '../../services/TeacherReportService';

jest.mock('../../services/TeacherReportService', () => ({ exportReport: jest.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
const button = label => [...host.querySelectorAll('button')].find(node => node.textContent === label);
beforeEach(() => {
    jest.clearAllMocks(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const render = async props => act(async () => root.render(<ReportExportButtons filters={{ groupId: 2, minScore: 0 }} {...props} />));

test('pending exports prevent duplicates and cancel without stale status replacing the cancellation', async () => {
    let options;
    TeacherReportService.exportReport.mockImplementation((filters, format, config) => { options = config; return new Promise(() => {}); });
    await render();
    await act(async () => { button('Descargar CSV').click(); button('Descargar PDF').click(); });
    expect(TeacherReportService.exportReport).toHaveBeenCalledTimes(1);
    expect(button('Descargar PDF').disabled).toBe(true);
    await act(async () => button('Cancelar descarga').click());
    expect(options.signal.aborted).toBe(true);
    await act(async () => options.onStatus({ status: 'READY' }));
    expect(host.textContent).toContain('Descarga cancelada');
    expect(host.textContent).not.toContain('Descargando el archivo');
    expect(button('Descargar CSV').disabled).toBe(false);
});

test('failed exports expose an actionable error and allow retry', async () => {
    TeacherReportService.exportReport.mockRejectedValue(new Error('No se pudo generar el reporte.'));
    await render();
    await act(async () => button('Descargar PDF').click());
    expect(host.querySelector('[role="alert"]').textContent).toContain('No se pudo generar');
    expect(button('Descargar PDF').disabled).toBe(false);
});

test('does not export with missing group or unapplied filters', async () => {
    await render({ filters: {} });
    expect(button('Descargar CSV').disabled).toBe(true);
    await render({ disabled: true });
    expect(button('Descargar PDF').disabled).toBe(true);
    expect(TeacherReportService.exportReport).not.toHaveBeenCalled();
});

test('unmount aborts an export in flight', async () => {
    let signal;
    TeacherReportService.exportReport.mockImplementation((filters, format, options) => { signal = options.signal; return new Promise(() => {}); });
    await render(); await act(async () => button('Descargar CSV').click());
    await act(async () => root.render(null));
    expect(signal.aborted).toBe(true);
});
