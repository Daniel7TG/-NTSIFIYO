import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ActiveGameRoute from './ActiveGameRoute';
import { useGame } from '../../context/GameContext';
jest.mock('../../context/GameContext', () => ({ useGame: jest.fn() }));
let host, root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
function show(data) {
    useGame.mockReturnValue({ currentGameData: data });
    act(() => root.render(<MemoryRouter initialEntries={['/games/quiz/jugar/12']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
        <Route path="/games/quiz/jugar/:activityId" element={<ActiveGameRoute><h1>Partida activa</h1></ActiveGameRoute>} />
    </Routes></MemoryRouter>));
}
test('a reload or a different activity offers recovery instead of playing stale content', () => {
    show({ activityId: 99 });
    expect(host.textContent).toContain('Inicia la actividad para jugar');
    expect(host.querySelector('a').getAttribute('href')).toBe('/games/quiz');
    expect(host.textContent).not.toContain('Partida activa');
});
test('the current activity renders its game', () => {
    show({ activityId: 12, gameType: 'QUESTIONNAIRE' });
    expect(host.textContent).toContain('Partida activa');
});
test('the same activity cannot render through the URL of another game family', () => {
    show({ activityId: 12, gameType: 'MEMORY_GAME' });
    expect(host.textContent).toContain('Inicia la actividad para jugar');
});
