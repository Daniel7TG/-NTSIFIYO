// client/src/services/DictionaryService.js
// Servicio de diccionario Mazahua-Español

import apiConfig from './apiConfig';

class DictionaryService {
    /**
     * Obtener categorías de palabras
     * GET /api/dictionary/words/categories
     * @returns {Promise<Object>} - CategoryListDTO
     */
    async getCategories() {
        try {
            const response = await apiConfig.get('/api/dictionary/words/categories');
            return {
                success: true,
                data: response.categories || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Obtener palabras por categoría con paginación
     * GET /api/dictionary/words/{category}?page=
     * @param {string} category - Categoría (o topicId) de palabras
     * @param {number} page - Número de página
     * @returns {Promise<{success: boolean, data: Array, currentPage?: number, totalPages?: number, error?: string, status?: number}>}
     */
    async getWordsByCategory(category, page = 0) {
        try {
            const response = await apiConfig.get(
                `/api/dictionary/words/${encodeURIComponent(category)}?page=${page}`
            );
            const words = response.content || response.words || [];
            return {
                success: true,
                data: words,
                currentPage: response.number ?? page,
                // El backend no siempre envía totalPages: se estima con el tamaño de página (20).
                totalPages: response.totalPages ?? (words.length < 20 ? page + 1 : page + 2)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: error.status,
                data: []
            };
        }
    }

    /**
     * Vista previa de una palabra (imagen/audio) para los selectores del editor.
     * GET /api/dictionary/words/details/{id}
     * El backend responde con el objeto o con un array de un elemento: se normaliza aquí.
     * @param {string|number} id - ID de la palabra
     * @returns {Promise<{success: boolean, data: Object|null, error?: string}>}
     */
    async getWordPreview(id) {
        try {
            const response = await apiConfig.get(`/api/dictionary/words/details/${id}`);
            const data = Array.isArray(response) ? (response[0] ?? null) : (response ?? null);
            return { success: true, data };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    /**
     * Obtener detalles de una palabra
     * GET /api/dictionary/words/{id}
     * @param {string} id - ID de la palabra
     * @returns {Promise<Object>} - WordDetailsDTO
     */
    async getWordDetails(id) {
        try {
            const response = await apiConfig.get(`/api/dictionary/words/${id}`);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Eliminar una palabra
     * DELETE /api/dictionary/words/{id}
     * @param {string} id - ID de la palabra
     * @returns {Promise<Object>}
     */
    async deleteWord(id) {
        try {
            await apiConfig.delete(`/api/dictionary/words/${id}`);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Crear una nueva palabra con imagen y audio
     * POST /api/dictionary/word/media  (multipart/form-data)
     * @param {FormData} formData - Campos: spanishText, mazahuaText, category, image, audio
     * @returns {Promise<Object>}
     */
    async createWord(formData) {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiConfig.baseUrl}/api/dictionary/word/media`, {
            method: 'POST',
            headers: {
                ...apiConfig.ngrokHeaders,
                ...(token && { 'Authorization': `Bearer ${token}` })
                // No Content-Type: el navegador lo pone automáticamente con el boundary correcto
            },
            body: formData
        });
        return apiConfig.handleResponse(response);
    }
    /**
     * Obtener todas las palabras minimamente (id y texto en español) para cache/búsqueda rápida
     * GET /api/dictionary/words/all
     * @returns {Promise<Object>}
     */
    async getAllWords() {
        try {
            const response = await apiConfig.get(`/api/dictionary/words/all`);
            return {
                success: true,
                data: response || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }
}

export default new DictionaryService();
