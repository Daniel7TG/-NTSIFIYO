import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import GameSummary from './GameSummary';
import ActivityApiService from '../../../services/ActivityApiService';

let mockGame;
jest.mock('../../../context/GameContext', () => ({ useGame: () => mockGame }));
jest.mock('../../../services/ActivityApiService', () => ({
    completeActivity: jest.fn(), startStudentActivity: jest.fn(), startGame: jest.fn(), saveGameStars: jest.fn(),
}));
global.IS_REACT_ACT_ENVIRONMENT = true;
let root, host, onRetry;
const logs = [{ questionId: 5, answerId: 6, isCorrect: false }];
async function render(extra = {}) {
    function Path() { return <span data-path>{useLocation().pathname}</span>; }
    await act(async () => root.render(<MemoryRouter initialEntries={['/games/quiz/jugar/18']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GameSummary activityId={18} gameId={15} correctAnswers={0}
        totalQuestions={1} responseLogs={logs} onRetry={onRetry} {...extra} /><Path /></MemoryRouter>));
}
const retryButton = () => [...host.querySelectorAll('button')].find(b => b.textContent.includes('Reintentar') && !b.textContent.includes('guardar'));
beforeEach(() => {
    jest.clearAllMocks();
    host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
    mockGame = { currentGameData: { activityId: 18, gameId: 15, attemptId: 20, fromAssignment: true }, saveGameData: jest.fn() };
    onRetry = jest.fn();
    ActivityApiService.completeActivity.mockResolvedValue({ success: true, data: { attemptId: 20, xpGained: 0 } });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

it('actualiza la URL cuando el reintento de práctica recibe otra actividad', async () => {
    mockGame.currentGameData.fromAssignment = false;
    ActivityApiService.startGame.mockResolvedValue({ success: true, data: { activityId: 75, gameId: 15, attemptId: 21 } });
    await render();
    await act(async () => retryButton().click());
    expect(host.querySelector('[data-path]').textContent).toBe('/games/quiz/jugar/75');
    expect(onRetry).toHaveBeenCalledTimes(1);
});

it('envía el intento actual y solo reinicia al confirmar un intento nuevo de la asignación', async () => {
    ActivityApiService.startStudentActivity.mockResolvedValue({ success: true, data: { activityId: 18, gameId: 15, attemptId: 21 } });
    await render();
    expect(ActivityApiService.completeActivity).toHaveBeenCalledWith(expect.objectContaining({ attemptId: 20, responseLogs: [{ questionId: 5, responseAnswerId: 6, isCorrect: false }] }));
    expect(ActivityApiService.saveGameStars).not.toHaveBeenCalled();
    await act(async () => retryButton().click());
    expect(ActivityApiService.startStudentActivity).toHaveBeenCalledWith(18);
    expect(mockGame.saveGameData).toHaveBeenCalledWith(expect.objectContaining({ attemptId: 21 }));
    expect(onRetry).toHaveBeenCalledTimes(1);
});

it('la práctica solicita un intento nuevo del juego', async () => {
    mockGame.currentGameData.fromAssignment = false;
    ActivityApiService.startGame.mockResolvedValue({ success: true, data: { activityId: 19, gameId: 15, attemptId: 21 } });
    await render();
    await act(async () => retryButton().click());
    expect(ActivityApiService.startGame).toHaveBeenCalledWith(15);
    expect(ActivityApiService.startStudentActivity).not.toHaveBeenCalled();
});

it('un error al iniciar otro intento mantiene el resultado y no reinicia la pantalla', async () => {
    ActivityApiService.startStudentActivity.mockResolvedValue({ success: false, error: 'Asignación desactivada' });
    await render(); await act(async () => retryButton().click());
    expect(host.textContent).toContain('Asignación desactivada');
    expect(onRetry).not.toHaveBeenCalled();
    expect(mockGame.saveGameData).not.toHaveBeenCalled();
});

it('oculta el reintento de una asignación perfecta', async () => {
    await render({ correctAnswers: 1 });
    expect(retryButton()).toBeUndefined();
});

it('no presenta éxito ni permite otra partida si el guardado falla', async () => {
    ActivityApiService.completeActivity.mockResolvedValue({ success: false, error: 'Servicio no disponible' });
    await render();
    expect(host.textContent).toContain('No se guardó el progreso');
    expect(retryButton().disabled).toBe(true);
    expect(onRetry).not.toHaveBeenCalled();
});
