// client/src/services/UserService.js
// Servicio de gestión de sesiones y usuarios

import apiConfig from './apiConfig';

class UserService {
    /**
     * Iniciar sesión de usuario
     * POST /api/user/session/start
     * @returns {Promise<Object>}
     */
    async startSession() {
        try {
            await apiConfig.post('/api/user/session/start');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Terminar sesión de usuario
     * PUT /api/user/session/end
     * @returns {Promise<Object>}
     */
    async endSession() {
        try {
            await apiConfig.put('/api/user/session/end');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Avatar actual del usuario autenticado.
     * GET /api/user/avatar — abierto a cualquier autenticado (maestro/admin también pueden leerlo).
     * @returns {Promise<{success: boolean, avatarId?: number, error?: string}>}
     */
    async getAvatar() {
        try {
            const response = await apiConfig.get('/api/user/avatar');
            // El backend puede responder el escalar o { avatarId }
            const avatarId = typeof response === 'object' && response !== null
                ? response.avatarId
                : Number(response);
            return { success: true, avatarId };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.status
            };
        }
    }

    /**
     * Cambiar el avatar del usuario autenticado.
     * PUT /api/user/avatar — body { avatarId }, solo STUDENT y VISITOR (403 para maestro/admin).
     * El usuario sale del token: nadie cambia el avatar de otro.
     * @param {number} avatarId - 0..19 (fuera de rango → 400)
     * @returns {Promise<{success: boolean, avatarId?: number, error?: string}>}
     */
    async updateAvatar(avatarId) {
        try {
            const response = await apiConfig.put('/api/user/avatar', { avatarId });
            const saved = typeof response === 'object' && response !== null
                ? (response.avatarId ?? avatarId)
                : Number(response);
            return { success: true, avatarId: saved };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.status
            };
        }
    }

}

export default new UserService();
