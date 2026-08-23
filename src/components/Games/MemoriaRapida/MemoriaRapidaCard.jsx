// client/src/components/Games/MemoriaRapida/MemoriaRapidaCard.js
// Tarjeta deslizable para Memoria Rápida
import React, { useRef, useState } from 'react';
import GameCard from '../GameCard/GameCard';
import IconSuccess from '../../../assets/svgs/success_game.svg';
import IconError from '../../../assets/svgs/error_cross.svg';

const SWIPE_THRESHOLD = 80; // px para aceptar como swipe

function MemoriaRapidaCard({ cardProps, onSwipe, disabled }) {
    const cardRef = useRef(null);
    const [dragState, setDragState] = useState({ dragging: false, startX: 0, currentX: 0 });

    const getDirection = () => {
        const dx = dragState.currentX - dragState.startX;
        if (dx > 30) return 'right';
        if (dx < -30) return 'left';
        return null;
    };

    const handleStart = (clientX) => {
        if (disabled) return;
        setDragState({ dragging: true, startX: clientX, currentX: clientX });
    };

    const handleMove = (clientX) => {
        if (!dragState.dragging || disabled) return;
        setDragState(prev => ({ ...prev, currentX: clientX }));
    };

    const handleEnd = () => {
        if (!dragState.dragging || disabled) return;
        const dx = dragState.currentX - dragState.startX;

        if (Math.abs(dx) >= SWIPE_THRESHOLD) {
            // Animar salida
            const direction = dx > 0 ? 'right' : 'left';
            const card = cardRef.current;
            if (card) {
                card.classList.add(direction === 'right' ? 'mr-card-exit-right' : 'mr-card-exit-left');
                setTimeout(() => onSwipe(direction), 300);
            }
        }

        setDragState({ dragging: false, startX: 0, currentX: 0 });
    };

    // Mouse events
    const onMouseDown = (e) => handleStart(e.clientX);
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();

    // Touch events
    const onTouchStart = (e) => handleStart(e.touches[0].clientX);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    const dx = dragState.dragging ? dragState.currentX - dragState.startX : 0;
    const rotation = dx * 0.08;
    const opacity = Math.max(0.5, 1 - Math.abs(dx) / 400);
    const direction = getDirection();

    const cardStyle = dragState.dragging
        ? {
            transform: `translateX(${dx}px) rotate(${rotation}deg)`,
            opacity,
            transition: 'none'
        }
        : {
            transform: 'translateX(0) rotate(0deg)',
            opacity: 1,
            transition: 'transform 0.3s ease, opacity 0.3s ease'
        };

    return (
        <div
            ref={cardRef}
            className={`mr-swipe-card mr-card-enter ${direction === 'right' ? 'swiping-right' :
                direction === 'left' ? 'swiping-left' : ''
                }`}
            style={cardStyle}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={handleEnd}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Feedback overlay */}
            {direction && (
                <div className={`mr-swipe-overlay ${direction === 'right' ? 'correct' : 'incorrect'}`} style={{ zIndex: 10 }}>
                    <span className="mr-overlay-icon">
                        {direction === 'right' ? <img src={IconSuccess} alt="Correcto" className="w-16 h-16" /> : <img src={IconError} alt="Incorrecto" className="w-16 h-16" />}
                    </span>
                </div>
            )}

            {/* Render GameCard instead of raw image */}
            <div style={{ pointerEvents: 'none' }}>
                <GameCard {...cardProps} disabled={true} />
            </div>
        </div>
    );
}

export default MemoriaRapidaCard;