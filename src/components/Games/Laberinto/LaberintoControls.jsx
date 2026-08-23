import React, { useEffect } from 'react';

const LaberintoControls = ({ onMove, onSelect, isSelectEnabled, hasActiveItem }) => {
    // Escuchar el teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            const consumed = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'];
            if (consumed.includes(e.key)) e.preventDefault();
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    onMove(0, -1);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    onMove(1, 0);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    onMove(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    onMove(-1, 0);
                    break;
                case 'Enter':
                case ' ':
                    // Siempre llama a onSelect; el GameView decide si recoger o soltar
                    onSelect();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onMove, onSelect]);

    const btnLabel = hasActiveItem ? 'Soltar' : 'Seleccionar';
    const btnClass = `laberinto-action-btn ${isSelectEnabled ? 'enabled' : 'disabled'} ${hasActiveItem ? 'dropping' : ''}`;

    return (
        <div className="laberinto-controls-container">
            <div className="laberinto-dpad">
                <button className="dpad-btn up" onClick={() => onMove(0, -1)}>▲</button>
                <button className="dpad-btn left" onClick={() => onMove(-1, 0)}>◀</button>
                <div className="dpad-center"></div>
                <button className="dpad-btn right" onClick={() => onMove(1, 0)}>▶</button>
                <button className="dpad-btn down" onClick={() => onMove(0, 1)}>▼</button>
            </div>

            <div className="laberinto-actions">
                <button
                    className={btnClass}
                    onClick={onSelect}
                    disabled={!isSelectEnabled}
                >
                    {btnLabel}
                </button>
            </div>
        </div>
    );
};

export default LaberintoControls;
