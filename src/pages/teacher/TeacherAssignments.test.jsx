import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import TeacherAssignments from './TeacherAssignments';
import { useReportActivitiesQuery } from '../../hooks/useTeacherReportQueries';
import ActivityAttemptHistory from '../../components/Teacher/ActivityAttemptHistory';

jest.mock('../../hooks/useTeacherReportQueries', () => ({ useReportActivitiesQuery: jest.fn() }), { virtual: true });
jest.mock('../../components/Teacher/ActivityAttemptHistory', () => jest.fn(({ activityId }) => <p>Historial real {activityId}</p>));
jest.mock('../../components/common/SectionHeader', () => ({ title }) => <h1>{title}</h1>);
jest.mock('../../hooks/useTeacherQueries', () => ({
    useTeacherAssignmentsQuery: () => ({ data: { activities: [{ gameId: 77, title: 'Asignación del grupo', gameType: 'PAIRS', difficult: 'EASY', completedCount: 0, totalCount: 1 }] } }),
    useTeacherStudentsQuery: () => ({ data: [{ username: 'alumno-a', firstname: 'Ana', lastname: 'Pérez' }] }),
    useTeacherGroupQuery: () => ({ data: { groupId: 42, grade: 3 } }),
    useTeacherInvalidate: () => ({ reloadAssignments: jest.fn() }),
}));
jest.mock('../../config/activityConfig', () => ({ getGameTypeInfo: () => ({ label: 'Pares', color: '#10b981' }) }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
async function mountAndExpand() {
    await act(async () => root.render(<TeacherAssignments />));
    await act(async () => host.querySelector('[title="Ver resultados de estudiantes"]').click());
    await act(async () => host.querySelector('[aria-expanded]').click());
}
beforeEach(() => {
    jest.clearAllMocks();
    ActivityAttemptHistory.mockImplementation(({ activityId }) => <p>Historial real {activityId}</p>);
    host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

it('resuelve por grupo, juego y alumno; entrega activityId individual al historial', async () => {
    useReportActivitiesQuery.mockReturnValue({ data: { items: [{ activityId: 501, gameId: 77, source: 'ASSIGNMENT', studentUsername: 'alumno-a' }], total: 1 } });
    await mountAndExpand();
    expect(useReportActivitiesQuery).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: 42, gameId: 77, source: 'ASSIGNMENT', studentIds: ['alumno-a'] }), { enabled: true });
    expect(ActivityAttemptHistory).toHaveBeenCalledWith(expect.objectContaining({ activityId: 501 }), expect.anything());
    expect(host.textContent).toContain('Historial real 501');
    expect(host.textContent).not.toContain('Historial real 77');
});

it('no abre historial de otro alumno ni de una práctica y muestra ausencia de actividad', async () => {
    useReportActivitiesQuery.mockReturnValue({ data: { items: [
        { activityId: 901, gameId: 77, source: 'ASSIGNMENT', studentUsername: 'otra-persona' },
        { activityId: 902, gameId: 77, source: 'PRACTICE', studentUsername: 'alumno-a' },
    ], total: 2 } });
    await mountAndExpand();
    expect(ActivityAttemptHistory).not.toHaveBeenCalled();
    expect(host.textContent).toContain('todavía no tiene un intento registrado');
});

it('mantiene el error visible y reintenta resolver la actividad', async () => {
    const refetch = jest.fn();
    useReportActivitiesQuery.mockReturnValue({ error: new Error('No se pudo consultar'), refetch });
    await mountAndExpand();
    expect(host.querySelector('[role="alert"]').textContent).toContain('No se pudo consultar');
    const retry = [...host.querySelectorAll('button')].find(button => button.textContent === 'Reintentar consulta');
    await act(async () => retry.click());
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(ActivityAttemptHistory).not.toHaveBeenCalled();
});
