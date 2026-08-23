// client/src/services/GameService.js
// Servicio de juegos: CRUD del recurso /api/games y arranque de partidas.
import apiConfig from './apiConfig';

const GameService = {

    // ── CRUD de juegos (/api/games) ───────────────────────────────────────────

    /**
     * Obtiene un juego por id (para editarlo)
     * GET /api/games/{id}
     * @param {number|string} id
     * @returns {Promise<{ success: boolean, data: Object|null, error?: string }>}
     */
    async getById(id) {
        try {
            const response = await apiConfig.get(`/api/games/${id}`);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Crea un juego
     * POST /api/games
     * @param {Object} gameDto
     * @returns {Promise<{ success: boolean, data: Object|null, error?: string }>}
     */
    async create(gameDto) {
        try {
            const response = await apiConfig.post('/api/games', gameDto);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Actualiza un juego existente
     * PUT /api/games/{id}
     * @param {number|string} id
     * @param {Object} gameDto
     * @returns {Promise<{ success: boolean, data: Object|null, error?: string }>}
     */
    async update(id, gameDto) {
        try {
            const response = await apiConfig.put(`/api/games/${id}`, gameDto);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    },

    /**
     * Elimina un juego
     * DELETE /api/games/{id}
     * @param {number|string} id
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    async deleteGame(id) {
        try {
            await apiConfig.delete(`/api/games/${id}`);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ── Partidas ──────────────────────────────────────────────────────────────

    /**
     * Obtiene la lista de actividades de un tipo
     * GET /api/activities/{activityType}
     * @returns {{ success: boolean, data: Array, error?: string }}
     */
    async getActivities(activityType) {
        try {
            const response = await apiConfig.get(`/api/activities/${activityType}`);
            // La respuesta es paginada: { content: [...], totalElements, ... }
            const content = response.content || [];
            return { success: true, data: content };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    },

    /**
     * Inicia una partida y obtiene los datos del juego (preguntas, configs, etc.)
     * POST /api/activities/start/game/{gameId}
     * @param {number} gameId
     * @returns {{ success: boolean, data: Object|null, error?: string }}
     */
    async startGame(gameId) {
        try {
            const response = await apiConfig.post(`/api/activities/start/game/${gameId}`);
            // Respuesta: { activityId, wordIds, questions, mediaId, gameConfigs }
            return { success: true, data: response };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }
};

export default GameService;
