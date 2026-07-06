import React, { useEffect, useState, useRef } from 'react';
import '../../../styles/components/games/gamePanel/GameAlert.css';
import { useCoyote } from '../../../context/CoyoteContext';

const GameAlert = ({ isOpen, type, onClose, autoCloseDuration = 1500 }) => {
    const { triggerReaction } = useCoyote();
    
    useEffect(() => {
        if (isOpen && type) {
            triggerReaction(type);
        }
    }, [isOpen, type, triggerReaction]);

    const [render, setRender] = useState(isOpen);
    const onCloseRef = useRef(onClose);

    // Keep the ref updated with the latest callback
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            if (autoCloseDuration > 0) {
                const timer = setTimeout(() => {
                    if (onCloseRef.current) onCloseRef.current();
                }, autoCloseDuration);
                return () => clearTimeout(timer);
            }
        } else {
            // Optional: short delay before unmounting to allow fade out
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoCloseDuration]);

    if (!render) return null;

    const isCorrect = type === 'correct';

    return (
        <div className={`game-confetti-container ${isOpen ? 'show' : 'hide'} ${isCorrect ? 'confetti-correct' : 'confetti-incorrect'}`}>
            {isCorrect && [...Array(40)].map((_, i) => (
                <div key={i} className={`confetti-particle cp-${i % 10}`} style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1 + Math.random()}s`
                }} />
            ))}
        </div>
    );
};

export default GameAlert;
