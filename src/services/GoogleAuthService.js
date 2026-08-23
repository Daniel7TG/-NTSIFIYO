// client/src/services/GoogleAuthService.js
// Servicio para autenticación con Google Identity Services (GIS) OAuth2

import apiConfig from './apiConfig';

const CLIENT_ID = '622374183056-384df8mr97gsn1f0mla31g1m297d6ugk.apps.googleusercontent.com';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;

class GoogleAuthService {
    /**
     * Carga dinámicamente el script de Google Identity Services.
     * Se asegura de cargarlo solo una vez.
     * @returns {Promise<void>}
     */
    loadGsiScript() {
        // Ya está cargado
        if (window.google?.accounts?.id) {
            return Promise.resolve();
        }
        // Ya hay una promesa en curso
        if (scriptPromise) {
            return scriptPromise;
        }
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GIS_SCRIPT_URL;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('No se pudo cargar el script de Google Identity Services'));
            document.head.appendChild(script);
        });
        return scriptPromise;
    }

    /**
     * Envía el idToken de Google al backend para validación y obtención de JWT.
     * POST /api/auth/oauth2/google
     * @param {string} idToken - El JWT de Google recibido desde GIS
     * @returns {Promise<Object>} - { success: true/false, data?, error?, status? }
     */
    async exchangeToken(idToken) {
        try {
            const response = await apiConfig.post('/api/auth/oauth2/google', {
                idToken: idToken
            });

            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error al validar el token de Google',
                status: error.status,
                data: error.responseData || null
            };
        }
    }

    /**
     * Completa el registro de un usuario nuevo con Google OAuth.
     * POST /api/auth/oauth2/google/register
     * @param {string} idToken - El JWT de Google recibido desde GIS
     * @param {Object} registrationData - { firstname, lastname, email, password, username }
     * @returns {Promise<Object>} - { success: true/false, data?, error?, status? }
     */
    async registerWithGoogle(idToken, registrationData) {
        try {
            const response = await apiConfig.post('/api/auth/oauth2/google/register', {
                idToken: idToken,
                firstname: registrationData.firstname,
                lastname: registrationData.lastname,
                email: registrationData.email,
                password: registrationData.password,
                username: registrationData.username
            });

            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error al completar el registro con Google',
                status: error.status,
                data: error.responseData || null
            };
        }
    }

    /**
     * Inicializa Google Identity Services.
     * @param {Function} callback - Función que recibe el credential (id_token)
     */
    initialize(callback) {
        if (!window.google?.accounts?.id) {
            throw new Error('El script de Google Identity Services no está cargado');
        }
        window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: callback,
            auto_select: false,
            cancel_on_tap_outside: true,
        });
    }

    /**
     * Renderiza el botón oficial de Sign in with Google en el contenedor especificado.
     * @param {HTMLElement} container - Elemento DOM donde se renderizará el botón
     */
    renderButton(container) {
        if (!window.google?.accounts?.id) return;
        window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            locale: 'es_MX',
            width: container.clientWidth || 280,
        });
    }

    /**
     * Desactiva la selección automática de cuenta de Google.
     * Debe llamarse al cerrar sesión para que Google no reseleccione automáticamente.
     */
    disableAutoSelect() {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }
    }
}

export default new GoogleAuthService();
