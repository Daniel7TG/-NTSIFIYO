import React, { createContext, useState, useContext, useEffect } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [currentGameData, setCurrentGameData] = useState(null);

    useEffect(() => {
        const clearSession = () => setCurrentGameData(null);
        window.addEventListener('gameSessionCleared', clearSession);
        return () => window.removeEventListener('gameSessionCleared', clearSession);
    }, []);

    const saveGameData = (data) => {
        setCurrentGameData(data);
    };

    const clearGameData = () => {
        setCurrentGameData(null);
    };

    return (
        <GameContext.Provider value={{ currentGameData, saveGameData, clearGameData }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
