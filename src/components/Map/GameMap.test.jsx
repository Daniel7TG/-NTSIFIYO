import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import GameMap from './GameMap';
import geometry from './mapGeometry.json';
import ActivityApiService from '../../services/ActivityApiService';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../context/GameContext', () => ({ useGame: () => ({ saveGameData: jest.fn() }) }));
jest.mock('../../services/ActivityApiService', () => ({
    getGamesByTopic: jest.fn().mockResolvedValue({ success: true, data: { content: [] } }),
    getMyGameStars: jest.fn().mockResolvedValue({ success: true, data: [] }),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

it('mantiene las nueve zonas dentro del lienzo y recorta sus áreas pulsables', async () => {
    ActivityApiService.getGamesByTopic.mockResolvedValue({ success: true, data: { content: [] } });
    ActivityApiService.getMyGameStars.mockResolvedValue({ success: true, data: [] });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
        await act(async () => root.render(<GameMap />));
        const buttons = [...host.querySelectorAll('.game-map-zone')];
        expect(buttons).toHaveLength(9);
        expect(host.querySelectorAll('picture source')).toHaveLength(4);
        for (const zone of Object.values(geometry)) {
            expect(zone.x + zone.w).toBeLessThanOrEqual(5516);
            expect(zone.y + zone.h).toBeLessThanOrEqual(3072);
            expect(zone.clipPath.startsWith('polygon(')).toBe(true);
        }
        for (const button of buttons) {
            expect(button.getAttribute('aria-label')).toBeTruthy();
            expect(button.style.clipPath.startsWith('polygon(')).toBe(true);
            expect(button.querySelector('img').alt).toBe('');
        }
        const park = buttons[1];
        await act(async () => park.click());
        expect(host.querySelector('.map-popup-title').textContent).toBe(park.getAttribute('aria-label'));
        expect(host.querySelector('.game-map-zone.active')).toBe(park);
    } finally {
        await act(async () => root.unmount());
        host.remove();
    }
});
