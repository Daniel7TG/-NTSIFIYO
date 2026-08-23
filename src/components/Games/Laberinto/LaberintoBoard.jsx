import React, { useRef, useEffect, useState } from 'react';
import GameCard from '../GameCard/GameCard';

const LaberintoBoard = ({
    grid,
    entrances,
    exits,
    avatarPos,
    activeItem,
    pathTraced,
    completedPairs
}) => {
    const boardRef = useRef(null);
    const gridRef = useRef(null);
    const [cellSizeX, setCellSizeX] = useState(0);
    const [cellSizeY, setCellSizeY] = useState(0);

    useEffect(() => {
        const updateSize = () => {
            // Measure the inner grid, not the outer container, so cell
            // coordinates stay correct even when the container has padding.
            const el = gridRef.current || boardRef.current;
            if (el && grid.length > 0) {
                const rect = el.getBoundingClientRect();
                setCellSizeX(rect.width / grid[0].length);
                setCellSizeY(rect.height / grid.length);
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [grid]);

    if (!grid || grid.length === 0) return null;

    const width = grid[0].length;
    const height = grid.length;

    // Build lookup maps for quick access: row → item
    const entranceByRow = {};
    entrances.forEach(item => {
        if (!completedPairs.has(item.pairId)) entranceByRow[item.row] = item;
    });
    const exitByRow = {};
    exits.forEach(item => {
        if (!completedPairs.has(item.pairId)) exitByRow[item.row] = item;
    });

    const renderSVGPath = () => {
        if (pathTraced.length < 2) return null;
        const d = pathTraced.map((p, index) => {
            const cx = p.x * cellSizeX + cellSizeX / 2;
            const cy = p.y * cellSizeY + cellSizeY / 2;
            return `${index === 0 ? 'M' : 'L'} ${cx} ${cy}`;
        }).join(' ');

        return (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
                <path d={d} fill="none" stroke="#E84C0A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };

    const renderCellContent = (x, y) => {
        // Avatar
        if (avatarPos.x === x && avatarPos.y === y) {
            return (
                <div className="laberinto-avatar" style={{ zIndex: 20 }}>
                    <div className="laberinto-avatar-circle" />
                </div>
            );
        }

        // Entrance card (left border)
        if (x === 0 && entranceByRow[y]) {
            const item = entranceByRow[y];
            const isActive = activeItem?.id === item.id;
            return (
                <div className={`laberinto-inline-card laberinto-entrance ${isActive ? 'active' : ''}`}>
                    <GameCard
                        text={item.showText ? item.text : null}
                        imageUrl={item.showImage ? item.imageUrl : null}
                        audioUrl={item.playAudio ? item.audioUrl : null}
                        disabled={true}
                    />
                </div>
            );
        }

        // Exit card (right border)
        if (x === width - 1 && exitByRow[y]) {
            const item = exitByRow[y];
            const isActive = activeItem?.id === item.id;
            return (
                <div className={`laberinto-inline-card laberinto-exit ${isActive ? 'active' : ''}`}>
                    <GameCard
                        text={item.showText ? item.text : null}
                        imageUrl={item.showImage ? item.imageUrl : null}
                        audioUrl={item.playAudio ? item.audioUrl : null}
                        disabled={true}
                    />
                </div>
            );
        }

        return null;
    };

    return (
        <div className="laberinto-board-container" ref={boardRef}>
            <div
                className="laberinto-grid"
                ref={gridRef}
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${width}, 1fr)`,
                    gridTemplateRows: `repeat(${height}, 1fr)`,
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}
            >
                {grid.map((row, y) =>
                    row.map((cell, x) => (
                        <div
                            key={`${x}-${y}`}
                            className="laberinto-cell"
                            style={{
                                gridColumn: x + 1,
                                gridRow: y + 1,
                                borderTop: cell.top ? '2px solid #1E3A8A' : '1px solid transparent',
                                borderRight: cell.right ? '2px solid #1E3A8A' : '1px solid transparent',
                                borderBottom: cell.bottom ? '2px solid #1E3A8A' : '1px solid transparent',
                                borderLeft: cell.left ? '2px solid #1E3A8A' : '1px solid transparent',
                            }}
                        >
                            {renderCellContent(x, y)}
                        </div>
                    ))
                )}
            </div>

            {cellSizeX > 0 && renderSVGPath()}
        </div>
    );
};

export default LaberintoBoard;
