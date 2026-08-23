// client/src/services/AuthService.js
// Servicio de autenticación

import apiConfig from './apiConfig';
import Roles from '../utils/roles';

class AuthService {
    /**
     * Login de usuario
     * POST /api/auth/login
     * @param {Object} credentials - { username, password, userType, grade? }
     * @returns {Promise<Object>} - LoginResponseDTO
     */
    async login(credentials) {
        try {
            // Limpiar cualquier token existente antes de hacer login para evitar errores CORS/403
            localStorage.removeItem('authToken');
            localStorage.removeItem('appUser');

            let payload = {};
            if (credentials.userType === Roles.STUDENT) {
                payload = {
                    listNumber: credentials.listNumber,
                    password: credentials.password,
                    grade: credentials.grade
                };
            } else {
                payload = {
                    username: credentials.username,
                    password: credentials.password,
                    grade: credentials.grade || null
                };
            }

            const response = await apiConfig.post(`/api/auth/login/${credentials.userType.toLowerCase()}`, payload);

            // Guardar token si viene en la respuesta
            if (response.jwtToken) {
                localStorage.setItem('authToken', response.jwtToken);
            }

            // Guardar información del usuario
            if (response.user) {
                localStorage.setItem('appUser', JSON.stringify(response.user));
            }

            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error desconocido'
            };
        }
    }

    /**
     * Registro de visitante
     * POST /api/auth/visitor
     * @param {Object} visitorData - RegisterVisitorRequestDTO
     * @returns {Promise<Object>}
     */
    async registerVisitor(visitorData) {
        try {
            // Limpiar cualquier token existente antes de registrarse
            localStorage.removeItem('authToken');
            localStorage.removeItem('appUser');

            const response = await apiConfig.post('/api/auth/visitor', {
                firstname: visitorData.firstname,
                lastname: visitorData.lastname,
                email: visitorData.email,
                password: visitorData.password,
                username: visitorData.username
            });

            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error desconocido',
                status: error.status
            };
        }
    }

    /**
     * Verificación de email de visitante
     * GET /api/auth/verify-email?token={token}
     * @param {string} token - Token de verificación
     * @returns {Promise<Object>}
     */
    async verifyEmail(token) {
        try {
            const response = await apiConfig.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
            return {
                success: true,
                message: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error desconocido',
                status: error.status
            };
        }
    }

    /**
     * Obtener el usuario autenticado con el JWT actual.
     * GET /api/user/me — sin body, requiere Authorization: Bearer <jwt>.
     *
     * Respuesta 200 (UserMeResponseDTO): { username, userType, firstName, lastName,
     * level, totalExperience, grade }. `level`/`totalExperience` solo en STUDENT y VISITOR;
     * `grade` solo en STUDENT; el resto llega null.
     *
     * Respuesta 403 (sin body) si el token falta, es inválido o expiró.
     *
     * @returns {Promise<{success: boolean, data?: Object, error?: string, status?: number}>}
     */
    async getMe() {
        try {
            const response = await apiConfig.get('/api/user/me');
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Error desconocido',
                status: error.status
            };
        }
    }

    /**
     * Cerrar sesión
     * Limpia el almacenamiento local
     */
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('appUser');
        return { success: true };
    }

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    /**
     * Obtiene los datos del usuario actual
     * @returns {Object|null}
     */
    getCurrentUser() {
        const userData = localStorage.getItem('appUser');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Obtiene el token de autenticación
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem('authToken');
    }
}

export default new AuthService();
