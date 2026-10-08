import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import TeacherReports from './TeacherReports';
import { useTeacherGroupQuery, useTeacherStudentsQuery } from '../../hooks/useTeacherQueries';
import { useGamesQuery } from '../../hooks/useGamesQueries';
import { useReportOverviewQuery, useReportStudentsQuery, useReportActivitiesQuery } from '../../hooks/useTeacherReportQueries';
import ReportExportButtons from '../../components/Teacher/ReportExportButtons';
import ActivityAttemptHistory from '../../components/Teacher/ActivityAttemptHistory';

jest.mock('../../hooks/useTeacherQueries', () => ({ useTeacherGroupQuery: jest.fn(), useTeacherStudentsQuery: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'teacher', userType: 'TEACHER' } }) }));
jest.mock('../../components/common/PageShell', () => ({ __esModule: true, default: ({ children }) => <main>{children}</main> }));
jest.mock('../../components/common/Breadcrumb', () => () => null);
jest.mock('../../hooks/useGamesQueries', () => ({ useGamesQuery: jest.fn() }));
jest.mock('../../hooks/useTeacherReportQueries', () => ({ useReportOverviewQuery: jest.fn(), useReportStudentsQuery: jest.fn(), useReportActivitiesQuery: jest.fn() }));
jest.mock('../../components/Teacher/ReportExportButtons', () => ({ __esModule: true, default: jest.fn(() => null) }));
jest.mock('../../components/Teacher/ActivityAttemptHistory', () => ({ __esModule: true, default: jest.fn(() => null) }));
global.IS_REACT_ACT_ENVIRONMENT = true;

let host, root, overviewQuery, studentsQuery, activitiesQuery;
const query = data => ({ data, isLoading: false, isFetching: false, error: null, refetch: jest.fn().mockResolvedValue({ data }) });
const latestArgs = mock => mock.mock.calls[mock.mock.calls.length - 1];
const button = text => [...host.querySelectorAll('button')].find(element => element.textContent === text);
async function mount(path = '/maestro/reportes') {
    await act(async () => root.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TeacherReports /></MemoryRouter>));
}
async function change(id, value) {
    const element = host.querySelector('#' + id);
    await act(async () => { element.value = value; Simulate.change(element); });
}
async function submit() {
    await act(async () => Simulate.submit(host.querySelector('form')));
}
beforeEach(() => {
    jest.clearAllMocks();
    host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
    useTeacherGroupQuery.mockReturnValue(query({ groupId: 42, grade: 3 }));
    useTeacherStudentsQuery.mockReturnValue(query([{ username: 'student-a', firstname: 'Ana', lastname: 'Alumno' }]));
    useGamesQuery.mockReturnValue(query({ data: [{ id: 15, title: 'Quiz de prueba' }], page: { totalPages: 1, last: true } }));
    overviewQuery = query({ students: 2, completedActivities: 3, assignments: 2, fulfilledAssignments: 1,
        compliancePercent: 50, correctAnswers: 8, totalQuestions: 11, accuracyPercent: 72.7,
        temporal: [], distribution: [], byActivity: [], byTopic: [] });
    studentsQuery = query({ page: 0, size: 10, total: 25, items: [{ username: 'student-a', firstName: 'Ana', lastName: 'Alumno',
        completedActivities: 1, assignments: 1, fulfilledAssignments: 1, compliancePercent: 100,
        correctAnswers: 1, totalQuestions: 1, accuracyPercent: 100, improvementPercent: null, xpAwarded: 10, lastActivityAt: null }] });
    activitiesQuery = query({ page: 0, size: 10, total: 21, items: [{ activityId: 18, gameId: 15, title: 'Quiz de prueba', studentUsername: 'student-a',
        gameType: 'QUESTIONNAIRE', topic: 'ANIMALS', source: 'ASSIGNMENT', status: 'PENDING', selectedAttemptNumber: null,
        completedAttempts: 0, accuracyPercent: null, correctAnswers: null, totalQuestions: null, incorrectAnswers: null, xpAwarded: null }] });
    useReportOverviewQuery.mockImplementation(() => overviewQuery);
    useReportStudentsQuery.mockImplementation(() => studentsQuery);
    useReportActivitiesQuery.mockImplementation(() => activitiesQuery);
    ReportExportButtons.mockImplementation(props => <button disabled={props.disabled}>Exportar prueba</button>);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

it('consulta el ID real del grupo y conserva el alumno preseleccionado por URL', async () => {
    await mount('/maestro/reportes?student=student-a');
    expect(latestArgs(useReportOverviewQuery)).toEqual([expect.objectContaining({ groupId: 42, studentIds: ['student-a'], attemptSelection: 'LAST' }), { enabled: true }]);
    expect(host.querySelector('#report-student').value).toBe('student-a');
    expect(latestArgs(ReportExportButtons)[0].filters).not.toHaveProperty('page');
    expect(latestArgs(ReportExportButtons)[0].filters).not.toHaveProperty('size');
});

it('muestra la precisión ponderada entregada por API y distingue pendientes de cero aciertos', async () => {
    await mount();
    expect(host.querySelector('[aria-label="Indicadores del grupo"]').textContent).toContain('72.7%');
    expect(host.querySelector('[aria-labelledby="report-activities-title"]').textContent).toContain('Sin datos');
    expect(host.querySelector('[aria-labelledby="report-activities-title"]').textContent).toContain('Sin intento terminado');
});

it('aplica gameId y BEST a todas las consultas y exportación sin confundir el activityId', async () => {
    await mount();
    await change('report-game', '15');
    await change('report-attempt', 'BEST');
    expect(button('Exportar prueba').disabled).toBe(true);
    expect(latestArgs(ReportExportButtons)[0].filters).not.toHaveProperty('gameId');
    await submit();
    for (const hook of [useReportOverviewQuery, useReportStudentsQuery, useReportActivitiesQuery]) {
        expect(latestArgs(hook)[0]).toMatchObject({ gameId: 15, attemptSelection: 'BEST', groupId: 42 });
        expect(latestArgs(hook)[0]).not.toHaveProperty('activityId');
    }
    expect(latestArgs(ReportExportButtons)[0]).toMatchObject({ filters: { gameId: 15, attemptSelection: 'BEST' }, disabled: false, includeDetails: true });
    await change('report-attempt', 'FIRST'); await submit();
    expect(latestArgs(useReportActivitiesQuery)[0].attemptSelection).toBe('FIRST');
});

it('rechaza fechas invertidas y precisión fuera de rango sin cambiar los filtros consultados', async () => {
    await mount();
    await change('report-from', '2026-10-10'); await change('report-to', '2026-10-01'); await submit();
    expect(host.querySelector('[role="alert"]').textContent).toContain('fecha inicial');
    expect(latestArgs(useReportOverviewQuery)[0]).not.toHaveProperty('fromDate');
    expect(button('Exportar prueba').disabled).toBe(true);
    await change('report-to', '2026-10-15'); await change('report-min', '101'); await submit();
    expect(host.querySelector('[role="alert"]').textContent).toContain('entre 0 y 100');
    expect(latestArgs(useReportOverviewQuery)[0]).not.toHaveProperty('minScore');
    await change('report-min', '80'); await change('report-max', '20'); await submit();
    expect(host.querySelector('[role="alert"]').textContent).toContain('no puede superar');
});

it('pagina alumnos y actividades de manera independiente y reinicia al aplicar filtros', async () => {
    await mount();
    await act(async () => host.querySelector('[aria-label="Página siguiente de alumnos"]').click());
    expect(latestArgs(useReportStudentsQuery)[0].page).toBe(1);
    expect(latestArgs(useReportActivitiesQuery)[0].page).toBe(0);
    await act(async () => host.querySelector('[aria-label="Página siguiente de actividades"]').click());
    expect(latestArgs(useReportActivitiesQuery)[0].page).toBe(1);
    expect(latestArgs(ReportExportButtons)[0].filters).not.toHaveProperty('page');
    await change('report-source', 'PRACTICE'); await change('report-status', 'COMPLETED'); await submit();
    expect(latestArgs(useReportStudentsQuery)[0]).toMatchObject({ page: 0, source: 'PRACTICE', status: 'COMPLETED' });
    expect(latestArgs(useReportActivitiesQuery)[0].page).toBe(0);
});

it('abre el historial usando activityId individual y número de intento seleccionado', async () => {
    activitiesQuery.data.items[0] = { ...activitiesQuery.data.items[0], selectedAttemptNumber: 2, status: 'COMPLETED' };
    await mount();
    await act(async () => button('Ver detalle').click());
    expect(latestArgs(ActivityAttemptHistory)[0]).toMatchObject({ activityId: 18, initialAttemptNumber: 2 });
    expect(host.textContent).toContain('Puede incluir intentos fuera del periodo');
});

it('muestra fallos explícitos y ofrece reintentar, sin presentarlos como una tabla vacía', async () => {
    activitiesQuery.error = new Error('Servidor temporalmente no disponible'); activitiesQuery.data = undefined;
    await mount();
    const panel = host.querySelector('[aria-labelledby="report-activities-title"]');
    expect(panel.textContent).toContain('Servidor temporalmente no disponible');
    expect(panel.textContent).not.toContain('No hay actividades');
    await act(async () => panel.querySelector('button').click());
    expect(activitiesQuery.refetch).toHaveBeenCalledTimes(1);
});

it('no habilita reportes ni exportación para un maestro sin grupo', async () => {
    useTeacherGroupQuery.mockReturnValue(query({ groupId: null, grade: null }));
    await mount();
    expect(host.textContent).toContain('Sin grupo asignado');
    expect(latestArgs(useReportActivitiesQuery)[1].enabled).toBe(false);
    expect(ReportExportButtons).not.toHaveBeenCalled();
});

it('actualiza resumen y ambas tablas desde Recargar contenido', async () => {
    await mount();
    await act(async () => host.querySelector('[aria-label="Recargar contenido"]').click());
    expect(overviewQuery.refetch).toHaveBeenCalledTimes(1);
    expect(studentsQuery.refetch).toHaveBeenCalledTimes(1);
    expect(activitiesQuery.refetch).toHaveBeenCalledTimes(1);
});
