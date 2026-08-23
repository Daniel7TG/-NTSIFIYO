import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/common/CustomAlert';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState(null);

    const showAlert = useCallback((config) => {
        setAlertConfig(config);
    }, []);

    const hideAlert = useCallback(() => {
        setAlertConfig(null);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alertConfig && (
                <CustomAlert
                    {...alertConfig}
                    onClose={() => {
                        if (alertConfig.onClose) alertConfig.onClose();
                        hideAlert();
                    }}
                />
            )}
        </AlertContext.Provider>
    );
};
