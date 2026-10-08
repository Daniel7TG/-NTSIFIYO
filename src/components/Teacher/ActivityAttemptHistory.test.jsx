import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ActivityAttemptHistory from './ActivityAttemptHistory';
import { useActivityAttemptHistoryQuery } from '../../hooks/useTeacherReportQueries';

jest.mock('../../hooks/useTeacherReportQueries', () => ({ useActivityAttemptHistoryQuery: jest.fn() }), { virtual: true });
jest.mock('../../config/activityConfig', () => ({ getGameTypeInfo: type => ({ label: type === 'PAIRS' ? 'Pares' : 'Quiz' }) }));
global.IS_REACT_ACT_ENVIRONMENT = true;

let host, root, refetch;
const first = {
    attemptId: 101, attemptNumber: 1, startedAt: '2026-10-07T10:00:00', finishedAt: '2026-10-07T10:01:05',
    correctAnswers: 0, totalQuestions: 1, accuracyPercent: 0, xpAwarded: 0, snapshotAvailable: true,
    gameTitle: 'Vocabulario', gameType: 'QUESTIONNAIRE', topic: 'NUMBERS', difficulty: 'EASY',
    responses: [{ order: 0, questionId: 30, questionText: '¿Cómo se dice agua?', selectedAnswerId: 41, selectedAnswerText: 'sol',
        correctAnswerId: 42, correctAnswerText: 'agua', correct: false, historicalTextAvailable: true,
        options: [{ answerId: 41, wordId: 2, spanishWord: 'sol', mazahuaWord: 'jyaru', correct: false },
            { answerId: 42, wordId: 1, spanishWord: 'agua', mazahuaWord: 'dehe', correct: true }] }],
};
const last = { ...first, attemptId: 102, attemptNumber: 2, correctAnswers: 1, accuracyPercent: 100, xpAwarded: 20,
    startedAt: '2026-10-07T11:00:00', finishedAt: '2026-10-07T11:00:00', responses: [], changeFromPreviousPercent: 100 };
const history = attempts => ({ attempts, firstResult: first, lastResult: last, bestResult: last });
function result(data) { useActivityAttemptHistoryQuery.mockReturnValue({ data, isLoading: false, isPending: false, error: null, refetch }); }
async function render(props = { activityId: 501 }) { await act(async () => root.render(<ActivityAttemptHistory {...props} />)); }
beforeEach(() => {
    host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
    refetch = jest.fn(); jest.clearAllMocks(); result(history([first, last]));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

it('abre el intento solicitado y permite revisar otro sin perder los resúmenes', async () => {
    await render({ activityId: 501, initialAttemptNumber: 1 });
    expect(host.querySelector('select').value).toBe('101');
    expect(host.textContent).toContain('Primer resultado');
    expect(host.textContent).toContain('Último resultado');
    expect(host.textContent).toContain('Mejor resultado');
    expect(host.textContent).toContain('1 min 5 s');
    const optionRows = [...host.querySelectorAll('li ul li')];
    expect(optionRows[0].textContent).toContain('Español: sol');
    expect(optionRows[0].textContent).toContain('Mazahua: jyaru');
    expect(optionRows[0].textContent).toContain('Elegida');
    expect(optionRows[0].textContent).not.toContain('Correcta');
    expect(optionRows[1].textContent).toContain('Correcta');
    await act(async () => { host.querySelector('select').value = '102'; host.querySelector('select').dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.textContent).toContain('Respuestas del intento 2');
    expect(host.textContent).toContain('0 min 0 s');
    expect(host.textContent).toContain('+100 puntos porcentuales');
});

it('conserva resultados cero y avisa cuando el historial y la XP son inferidos', async () => {
    const legacy = { ...first, snapshotAvailable: false, xpBaselineInferred: true,
        responses: [{ order: 0, selectedAnswerId: 0, correct: false, historicalTextAvailable: false, options: [] }] };
    result(history([legacy])); await render();
    expect(host.textContent).toContain('0%');
    expect(host.textContent).toContain('XP otorgada0');
    expect(host.textContent).toContain('anterior al historial detallado');
    expect(host.textContent).toContain('estimación recuperada');
    expect(host.textContent).toContain('Referencia #0');
    expect(host.textContent).toContain('El texto original');
    expect(host.textContent).not.toContain('undefined');
});

it('muestra el intento abierto más reciente sin inventar resultado ni duración', async () => {
    const open = { ...last, attemptId: 103, attemptNumber: 3, finishedAt: null, correctAnswers: null, accuracyPercent: null, xpAwarded: null };
    result(history([first, last, open])); await render({ activityId: 501, initialAttemptNumber: 0 });
    expect(host.querySelector('select').value).toBe('103');
    expect(host.textContent).toContain('Sin resultado');
    expect(host.textContent).toContain('Tiempo transcurridoEn curso');
    expect(host.textContent).toContain('Las respuestas estarán disponibles cuando termine');
    expect(host.textContent).not.toContain('Tiempo transcurrido0 min');
});

it('distingue una opción por wordId en juegos de pares', async () => {
    const pair = { ...first, gameType: 'PAIRS', responses: [{ order: 0, selectedAnswerId: 2, correctAnswerId: 1, correct: false,
        options: [{ answerId: null, wordId: 1, spanishWord: 'agua', mazahuaWord: 'dehe', correct: null },
            { answerId: null, wordId: 2, spanishWord: 'sol', mazahuaWord: 'jyaru', correct: null }] }] };
    result(history([pair])); await render();
    const options = [...host.querySelectorAll('li ul li')];
    expect(options[0].textContent).toContain('Correcta');
    expect(options[0].textContent).not.toContain('Elegida');
    expect(options[1].textContent).toContain('Elegida');
    expect(host.textContent).toContain('Respuesta elegidasol / jyaru');
    expect(host.textContent).toContain('Respuesta correctaagua / dehe');
});

it('permite reintentar un fallo y distingue un historial vacío', async () => {
    useActivityAttemptHistoryQuery.mockReturnValue({ error: new Error('Servicio no disponible'), refetch });
    await render();
    expect(host.querySelector('[role="alert"]').textContent).toContain('Servicio no disponible');
    await act(async () => host.querySelector('button').click());
    expect(refetch).toHaveBeenCalledTimes(1);
    result({ attempts: [] }); await render();
    expect(host.textContent).toContain('todavía no ha iniciado ningún intento');
});

it('restablece la selección al cambiar de actividad y no consulta un ID ausente', async () => {
    await render({ activityId: 501, initialAttemptNumber: 1 });
    result(history([last])); await render({ activityId: 502 });
    expect(host.querySelector('select').value).toBe('102');
    await render({ activityId: null });
    expect(useActivityAttemptHistoryQuery).toHaveBeenLastCalledWith(null, { enabled: false });
    expect(host.textContent).toContain('No hay una actividad individual');
});
