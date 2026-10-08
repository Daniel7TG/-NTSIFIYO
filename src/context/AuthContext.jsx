import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import GoogleAuthService from '../services/GoogleAuthService';
import { readJwtClaims, readStoredSession } from '../utils/authSession';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [initialSession] = useState(readStoredSession);
    const [user, setUser] = useState(initialSession.user);
    const [token, setToken] = useState(initialSession.token);
    const [sessionExpired, setSessionExpired] = useState(initialSession.invalid);

    const clearSession = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('appUser');
        localStorage.removeItem('authToken');
        queryClient.clear();
        GoogleAuthService.disableAutoSelect();
    }, [queryClient]);

    const login = (userData, userToken) => {
        const claims = readJwtClaims(userToken);
        if (!claims || claims.exp * 1000 <= Date.now()) {
            clearSession();
            setSessionExpired(true);
            return;
        }
        const currentUser = { ...userData, username: claims.sub };
        queryClient.clear();
        setUser(currentUser);
        setToken(userToken);
        setSessionExpired(false);
        localStorage.setItem('appUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', userToken);
    };

    const logout = useCallback(() => {
        clearSession();
        setSessionExpired(false);
    }, [clearSession]);

    const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

    /** Actualiza campos del usuario en memoria y en localStorage (p. ej. avatarId). */
    const updateUser = useCallback((patch) => {
        setUser(prev => {
            if (!prev) return prev;
            const next = { ...prev, ...patch };
            localStorage.setItem('appUser', JSON.stringify(next));
            return next;
        });
    }, []);

    // Restaurar la sesión usa el login guardado y la caducidad del JWT.
    useEffect(() => {
        if (initialSession.invalid) clearSession();
        else if (initialSession.user) localStorage.setItem('appUser', JSON.stringify(initialSession.user));
    }, [initialSession, clearSession]);

    useEffect(() => {
        if (!token) return;
        const expire = () => {
            clearSession();
            setSessionExpired(true);
        };
        // El navegador puede pausar timers; comprobar también al volver a la pestaña.
        let timer;
        const checkExpiration = () => {
            clearTimeout(timer);
            const remaining = (readJwtClaims(token)?.exp || 0) * 1000 - Date.now();
            if (remaining <= 0) expire();
            else timer = setTimeout(checkExpiration, Math.min(remaining, 2147483647));
        };
        const handleUnauthorized = (event) => {
            if (event.detail?.token === token) expire();
        };
        checkExpiration();
        window.addEventListener('focus', checkExpiration);
        window.addEventListener('sessionUnauthorized', handleUnauthorized);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('focus', checkExpiration);
            window.removeEventListener('sessionUnauthorized', handleUnauthorized);
        };
    }, [token, clearSession]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            updateUser,
            isAuthenticated: !!user && !!token,
            sessionExpired,
            clearSessionExpired,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
