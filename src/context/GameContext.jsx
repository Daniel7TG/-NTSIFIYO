import React, { createContext, useState, useContext } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [currentGameData, setCurrentGameData] = useState(null);

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
