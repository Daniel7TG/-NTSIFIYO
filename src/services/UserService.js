// client/src/services/UserService.js
// Servicio de gestión de sesiones y usuarios

import apiConfig from './apiConfig';

class UserService {
    /**
     * Iniciar sesión de usuario
     * POST /api/user/session/start
     * @returns {Promise<Object>}
     */
    async startSession(token = localStorage.getItem('authToken')) {
        return this.updateSession('/api/user/session/start', 'POST', token);
    }

    async endSession(token = localStorage.getItem('authToken')) {
        return this.updateSession('/api/user/session/end', 'PUT', token);
    }

    async updateSession(path, method, token) {
        if (!token) return { success: false, error: 'No hay sesión autenticada' };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(`${apiConfig.baseUrl}${path}`, {
                method,
                headers: { 'Content-Type': 'application/json', ...apiConfig.ngrokHeaders, Authorization: `Bearer ${token}` },
                signal: controller.signal,
                keepalive: true,
            });
            await apiConfig.handleResponse(response, token);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            clearTimeout(timeout);
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
