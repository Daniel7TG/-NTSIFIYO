import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider, useGame } from './GameContext';
test('logout clears the game before another user can reuse it', () => {
    const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host);
    function Fixture() {
        const { currentGameData, saveGameData } = useGame();
        return <><button onClick={() => saveGameData({ activityId: 12 })}>Iniciar</button>
            <span>{currentGameData ? 'Partida activa' : 'Sin partida'}</span></>;
    }
    try {
        act(() => root.render(<GameProvider><Fixture /></GameProvider>));
        act(() => host.querySelector('button').click());
        expect(host.textContent).toContain('Partida activa');
        act(() => window.dispatchEvent(new Event('gameSessionCleared')));
        expect(host.textContent).toContain('Sin partida');
    } finally { act(() => root.unmount()); host.remove(); }
});
