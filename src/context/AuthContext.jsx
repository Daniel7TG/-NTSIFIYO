import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import GoogleAuthService from '../services/GoogleAuthService';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

/**
 * Normaliza UserMeResponseDTO (GET /api/user/me) al shape que ya usa la app.
 * El DTO manda `firstName`/`lastName`; el resto de la app lee `firstname`/`lastname`.
 * Los campos por rol (level, totalExperience, grade) llegan null cuando no aplican,
 * así que solo se sobrescriben si vienen con valor (p. ej. el `grade` del maestro
 * —su grupo— no debe borrarse con el null que /me devuelve para TEACHER).
 */
const mergeMe = (prev, me) => ({
    ...(prev || {}),
    username:  me.username,
    userType:  me.userType,
    firstname: me.firstName,
    lastname:  me.lastName,
    ...(me.level           != null && { level: me.level }),
    ...(me.totalExperience != null && { totalExperience: me.totalExperience }),
    ...(me.grade           != null && { grade: me.grade }),
});

export const AuthProvider = ({ children }) => {
    // Inicializamos el estado intentando leer del localStorage
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('appUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('authToken'));

    // Mientras se valida el token guardado contra el backend
    const [isVerifying, setIsVerifying] = useState(() => !!localStorage.getItem('authToken'));
    // true cuando el backend rechazó el token guardado (sesión caducada/inválida)
    const [sessionExpired, setSessionExpired] = useState(false);

    const clearSession = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('appUser');
        localStorage.removeItem('authToken');
        // Evitar que Google reseleccione automáticamente la cuenta en el próximo login
        GoogleAuthService.disableAutoSelect();
    }, []);

    // Función para iniciar sesión
    const login = (userData, userToken) => {
        // 1. Guardar en el estado de React (para la UI)
        setUser(userData);
        setToken(userToken);
        setSessionExpired(false);

        // 2. Persistir en el navegador (para F5)
        localStorage.setItem('appUser', JSON.stringify(userData));
        localStorage.setItem('authToken', userToken);
    };

    // Función para cerrar sesión
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

    // ── Verificación de sesión al entrar a la aplicación ──────────────────────
    // Si hay token guardado se contrasta con GET /api/user/me. El backend responde
    // 403 (sin body) cuando el token falta, es inválido o expiró: en ese caso se
    // cierra la sesión, la UI vuelve a mostrar el login y las rutas protegidas
    // redirigen solas (ProtectedRoute depende de isAuthenticated).
    useEffect(() => {
        if (!localStorage.getItem('authToken')) {
            setIsVerifying(false);
            return;
        }

        let cancelled = false;

        (async () => {
            const result = await AuthService.getMe();
            if (cancelled) return;

            if (result.success) {
                // Refresca los datos del usuario (nivel, XP, nombre…) con lo que dice el servidor
                setUser(prev => {
                    const merged = mergeMe(prev, result.data);
                    localStorage.setItem('appUser', JSON.stringify(merged));
                    return merged;
                });
            } else if (result.status === 403 || result.status === 401) {
                clearSession();
                setSessionExpired(true);
            }
            // Un fallo de red (sin status) no invalida la sesión local: se conserva.

            setIsVerifying(false);
        })();

        return () => { cancelled = true; };
    }, [clearSession]);

    // Evita renderizar la app con un token que aún no se sabe si es válido:
    // sin esto, las vistas protegidas dispararían peticiones que fallarían con 403.
    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            updateUser,
            isAuthenticated: !!user,
            sessionExpired,
            clearSessionExpired,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => useContext(AuthContext);
