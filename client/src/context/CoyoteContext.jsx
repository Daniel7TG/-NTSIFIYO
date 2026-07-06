import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const CoyoteContext = createContext();

export const CoyoteProvider = ({ children }) => {
    const [emotion, setEmotion] = useState('esperando');
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState('left');
    const timerRef = useRef(null);

    const speak = useCallback((msg, emo = 'esperando', duration = 15000) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        
        setMessage(msg);
        setEmotion(emo);
        setVisible(true);

        if (duration > 0) {
            timerRef.current = setTimeout(() => {
                setMessage('');
                setEmotion('esperando');
            }, duration);
        }
    }, []);

    const triggerReaction = useCallback((type) => {
        if (type === 'correct') {
            speak('¡Excelente! ¡Sigue así!', 'celebracion', 2000);
        } else if (type === 'incorrect') {
            speak('¡Oh! No te preocupes, ¡inténtalo de nuevo!', 'triste', 2000);
        }
    }, [speak]);

    const hide = useCallback(() => {
        setVisible(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    return (
        <CoyoteContext.Provider value={{ emotion, message, visible, position, speak, triggerReaction, hide, setPosition }}>
            {children}
        </CoyoteContext.Provider>
    );
};

export const useCoyote = () => useContext(CoyoteContext);
