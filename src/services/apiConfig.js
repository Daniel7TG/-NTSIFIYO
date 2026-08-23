// client/src/services/apiConfig.js
// Configuración central del API

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mild-donella-daniel7g-b3e46241.koyeb.app';

// TEMPORAL: mientras el backend se sirva desde un túnel ngrok gratuito, éste
// devuelve una página HTML de advertencia en lugar de la respuesta real.
// El header `ngrok-skip-browser-warning` (cualquier valor) la omite.
// Eliminar cuando el backend deje de estar detrás de ngrok.
const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

/** ¿La URL apunta al backend configurado? (para no romper CORS en hosts externos) */
const isApiUrl = (url) => typeof url === 'string' && url.startsWith(API_BASE_URL);

const apiConfig = {
    baseUrl: API_BASE_URL,

    /** Headers temporales de ngrok, para peticiones que no usan getHeaders() */
    ngrokHeaders: NGROK_HEADERS,

    /**
     * Obtiene los headers para las peticiones
     * Incluye el token JWT si existe
     */
    getHeaders: () => {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...NGROK_HEADERS,
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    },

    /**
     * fetch para recursos sueltos (imágenes, audio) que añade los headers de
     * ngrok sólo cuando la URL apunta al backend, evitando preflights CORS
     * innecesarios contra hosts externos.
     */
    fetchAsset: (url, options = {}) => fetch(url, {
        ...options,
        headers: {
            ...(isApiUrl(url) ? NGROK_HEADERS : {}),
            ...options.headers
        }
    }),

    /**
     * Maneja la respuesta del servidor
     * @param {Response} response - Respuesta de fetch
     * @returns {Promise<any>} - Datos parseados o error
     */
    handleResponse: async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Construir un mensaje de error legible
            let errorMessage = errorData.message || `Error: ${response.status}`;

            // Si hay errores de validación, formatearlos
            if (errorData.validationErrors && typeof errorData.validationErrors === 'object') {
                const validationMessages = Object.entries(errorData.validationErrors)
                    .map(([field, msg]) => `${field}: ${msg}`);
                errorMessage = validationMessages.join('. ');
            }

            // Si hay un error de cuenta bloqueada con tiempo de espera
            if (errorData.errorCode === 'ACCOUNT_LOCKED') {
                const waitTime = errorData.lockoutTimeMs || errorData.retryAfterMs || errorData.waitTimeMs || errorData.waitTime;
                if (waitTime) {
                    const seconds = Math.ceil(waitTime / 1000);
                    errorMessage = `Cuenta bloqueada por demasiados intentos. Espera ${seconds} segundos antes de intentar de nuevo.`;
                }
            }

            // Limpiar cualquier formato extraño de milisegundos en el mensaje
            // Busca patrones como "30000", "30000ms", "30000 millis" y convierte a segundos
            const msPattern = /(\d{4,})\s*(?:ms|millis|milisegundos?)?/i;
            const msMatch = errorMessage.match(msPattern);
            if (msMatch) {
                const ms = parseInt(msMatch[1], 10);
                if (ms >= 1000 && ms < 100000) { // Probable valor en milisegundos
                    const seconds = Math.ceil(ms / 1000);
                    errorMessage = errorMessage.replace(/\d{4,}\s*(?:ms|millis|milisegundos?)?/i, `${seconds} segundos`);
                }
            }

            const error = new Error(errorMessage);
            error.responseData = errorData; // Preservar datos completos para uso avanzado
            error.status = response.status;
            throw error;
        }

        // Manejar respuestas vacías (204 No Content)
        const text = await response.text();
        if (!text) return {};

        // Detectar si es JSON o texto plano
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return JSON.parse(text);
        }
        return text;
    },

    /**
     * Realiza una petición GET
     */
    get: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: apiConfig.getHeaders()
        });
        return apiConfig.handleResponse(response);
    },

    /**
     * Realiza una petición POST
     */
    post: async (endpoint, body = null) => {
        const headers = apiConfig.getHeaders();
        if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
            delete headers['Content-Type'];
            body = null;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            ...(body && { body: JSON.stringify(body) })
        });
        return apiConfig.handleResponse(response);
    },

    /**
     * Realiza una petición PUT
     */
    put: async (endpoint, body = null) => {
        const headers = apiConfig.getHeaders();
        if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
            delete headers['Content-Type'];
            body = null;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            ...(body && { body: JSON.stringify(body) })
        });
        return apiConfig.handleResponse(response);
    },

    /**
     * Realiza una petición PATCH
     */
    patch: async (endpoint, body = null) => {
        const headers = apiConfig.getHeaders();
        if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
            delete headers['Content-Type'];
            body = null;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            ...(body && { body: JSON.stringify(body) })
        });
        return apiConfig.handleResponse(response);
    },

    /**
     * Realiza una petición DELETE
     */
    delete: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: apiConfig.getHeaders()
        });
        return apiConfig.handleResponse(response);
    }
};

export default apiConfig;
