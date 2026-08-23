import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleAuthService from '../../services/GoogleAuthService';
import GoogleRegisterModal from './GoogleRegisterModal';
import UserService from '../../services/UserService';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import Roles from '../../utils/roles';

/**
 * Botón de inicio de sesión con Google usando Google Identity Services (GIS).
 * Carga el script de GIS dinámicamente, renderiza el botón oficial,
 * maneja el callback de credenciales y completa el flujo de autenticación.
 *
 * Flujo soportado:
 * 1. Usuario hace clic en Google → obtiene idToken
 * 2. POST /api/auth/oauth2/google
 *    - 200 → login normal
 *    - 409 → abre modal para completar registro
 * 3. POST /api/auth/oauth2/google/register
 *    - 201 → login después de registro
 */
const GoogleLoginButton = () => {
    const buttonContainerRef = useRef(null);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showAlert } = useAlert();

    const [isLoading, setIsLoading] = useState(false);
    const [gisReady, setGisReady] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el flujo de registro (cuando el backend responde 409)
    const [isNewUser, setIsNewUser] = useState(false);
    const [googleIdToken, setGoogleIdToken] = useState(null);
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerFirstname, setRegisterFirstname] = useState('');
    const [registerLastname, setRegisterLastname] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerError, setRegisterError] = useState('');

    /**
     * Decodifica el JWT de Google (credential) solo para extraer info UI.
     * NO se usa para validación de seguridad.
     */
    const decodeJwtCredential = useCallback((jwtString) => {
        try {
            const base64Url = jwtString.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }, []);

    /**
     * Completa el flujo de login una vez que se tiene el JWT (tanto para login directo como post-registro).
     */
    const completeLoginFlow = useCallback(
        async (data, fallbackName = '') => {
            const jwtToken = data.jwt;
            if (!jwtToken) {
                showAlert({
                    mode: 'error',
                    title: 'Error de autenticación',
                    message: 'El servidor no devolvió un token válido.',
                    isClosable: true,
                });
                setIsLoading(false);
                return;
            }

            const userData = {
                firstname: data.firstName || data.firstname || fallbackName || '',
                lastname: data.lastName || data.lastname || '',
                username: data.username || '',
                email: data.email || '',
                userType: data.userType || Roles.VISITOR,
            };

            // Login en el contexto de auth
            login(userData, jwtToken);

            // Iniciar sesión en el backend (tracking)
            await UserService.startSession();

            // Notificar a otros componentes
            window.dispatchEvent(new Event('authChanged'));

            // Mostrar alerta de bienvenida
            showAlert({
                mode: 'success',
                title: '¡Bienvenido!',
                message: `Bienvenido, ${userData.firstname}`,
                isClosable: true,
            });

            // Redirigir al dashboard de visitantes
            navigate('/visitante/dashboard');
        },
        [login, showAlert, navigate]
    );

    /**
     * Flujo principal tras recibir el credential de Google.
     */
    const handleCredentialResponse = useCallback(
        async (credentialResponse) => {
            const idToken = credentialResponse.credential;
            if (!idToken) {
                showAlert({
                    mode: 'error',
                    title: 'Error de Google',
                    message: 'No se recibió el token de identidad de Google. Intenta de nuevo.',
                    isClosable: true,
                });
                return;
            }

            setIsLoading(true);
            setError(null);
            setRegisterError('');

            // Decodificar solo para mostrar nombre en el spinner / alerta / fallback de registro
            const decoded = decodeJwtCredential(idToken);
            const googleName = decoded?.given_name || decoded?.name || '';

            try {
                // 1. Enviar idToken al backend
                const result = await GoogleAuthService.exchangeToken(idToken);

                if (!result.success) {
                    // CASO B: El email NO está registrado (409 CONFLICT)
                    if (result.status === 409 && result.data) {
                        setIsNewUser(true);
                        setGoogleIdToken(idToken);
                        setRegisterEmail(result.data.email || decoded?.email || '');
                        setRegisterFirstname(result.data.firstName || decoded?.given_name || '');
                        setRegisterLastname(result.data.lastName || decoded?.family_name || '');
                        setRegisterUsername('');
                        setRegisterPassword('');
                        setRegisterError('');
                        setIsLoading(false);
                        return;
                    }

                    // Otros errores
                    showAlert({
                        mode: 'error',
                        title: 'Error de autenticación',
                        message: result.error || 'No se pudo iniciar sesión con Google. Intenta de nuevo.',
                        isClosable: true,
                    });
                    setIsLoading(false);
                    return;
                }

                // CASO A: El email YA está registrado (200 OK)
                const data = result.data;
                await completeLoginFlow(data, googleName);
            } catch (err) {
                console.error('Google OAuth error:', err);
                showAlert({
                    mode: 'error',
                    title: 'Error de conexión',
                    message: 'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.',
                    isClosable: true,
                });
                setIsLoading(false);
            }
        },
        [showAlert, decodeJwtCredential, completeLoginFlow]
    );

    /**
     * Envía el formulario de registro completado para un usuario nuevo de Google.
     */
    const handleGoogleRegister = useCallback(
        async (e) => {
            e.preventDefault();
            setRegisterError('');
            setIsLoading(true);

            if (!registerUsername.trim() || !registerPassword.trim()) {
                setRegisterError('El nombre de usuario y la contraseña son obligatorios.');
                setIsLoading(false);
                return;
            }

            try {
                const result = await GoogleAuthService.registerWithGoogle(googleIdToken, {
                    firstname: registerFirstname,
                    lastname: registerLastname,
                    email: registerEmail,
                    password: registerPassword,
                    username: registerUsername,
                });

                if (!result.success) {
                    setRegisterError(
                        result.error || 'No se pudo completar el registro. Intenta de nuevo.'
                    );
                    setIsLoading(false);
                    return;
                }

                const data = result.data;
                setIsNewUser(false);
                await completeLoginFlow(data, registerFirstname);
            } catch (err) {
                console.error('Google register error:', err);
                setRegisterError(
                    'Error de conexión. Verifica tu conexión e intenta de nuevo.'
                );
                setIsLoading(false);
            }
        },
        [
            googleIdToken,
            registerFirstname,
            registerLastname,
            registerEmail,
            registerPassword,
            registerUsername,
            completeLoginFlow,
        ]
    );

    /**
     * Cierra el modal de registro y vuelve al botón de Google.
     */
    const handleCancelRegistration = useCallback(() => {
        setIsNewUser(false);
        setGoogleIdToken(null);
        setRegisterEmail('');
        setRegisterFirstname('');
        setRegisterLastname('');
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterError('');
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function initGoogle() {
            try {
                await GoogleAuthService.loadGsiScript();
                if (cancelled) return;

                GoogleAuthService.initialize(handleCredentialResponse);
                if (cancelled) return;

                setGisReady(true);
            } catch (err) {
                console.error('Error cargando Google Identity Services:', err);
                setError('No se pudo cargar el inicio de sesión de Google. Intenta recargar la página.');
            }
        }

        initGoogle();

        return () => {
            cancelled = true;
        };
    }, [handleCredentialResponse]);

    useEffect(() => {
        if (isNewUser || !gisReady || !buttonContainerRef.current) return;
        GoogleAuthService.renderButton(buttonContainerRef.current);
    }, [gisReady, isNewUser]);

    return (
        <div className="relative w-full">
            {/* Contenedor del botón oficial de Google */}
            <div
                ref={buttonContainerRef}
                className={`w-full flex justify-center ${
                    isLoading ? 'opacity-50 pointer-events-none' : ''
                }`}
            />

            {/* Spinner de carga (overlay) */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-lg gap-2 z-10">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                        progress_activity
                    </span>
                    <span className="text-sm font-semibold text-primary-dark">
                        Iniciando sesión...
                    </span>
                </div>
            )}

            {/* Error de carga de GIS */}
            {error && !isLoading && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mt-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Modal de registro (se monta en un portal visual aunque está en el mismo árbol) */}
            <GoogleRegisterModal
                isOpen={isNewUser}
                onClose={handleCancelRegistration}
                onSubmit={handleGoogleRegister}
                isLoading={isLoading}
                error={registerError}
                fields={{
                    email: registerEmail,
                    firstname: registerFirstname,
                    lastname: registerLastname,
                    username: registerUsername,
                    password: registerPassword,
                }}
                setters={{
                    setFirstname: setRegisterFirstname,
                    setLastname: setRegisterLastname,
                    setUsername: setRegisterUsername,
                    setPassword: setRegisterPassword,
                }}
            />
        </div>
    );
};

export default GoogleLoginButton;
