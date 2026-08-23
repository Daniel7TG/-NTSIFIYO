import apiConfig from './apiConfig';

/**
 * ContentType enums mapping to backend MediaType
 */
export const ContentType = {
    POEMAS: 'POEM',
    LEYENDAS: 'LEGEND',
    CUENTOS: 'ANECDOTE',
    CANCIONES: 'SONG'
};

const MediaService = {
    /**
     * Obtiene la lista de elementos multimedia por tipo
     * @param {string} type - Tipo de contenido (ej. 'LEGEND', 'SONG')
     */
    getMediaByType: async (type) => {
        return await apiConfig.get(`/api/media?type=${type}&page=0&size=50`);
    },

    /**
     * Obtiene los recursos de transmisión para un elemento multimedia
     * @param {number} mediaId - ID del elemento multimedia
     * @returns {Promise<{url: string, espSubtitlesUrl: string, mazSubtitlesUrl: string}>}
     */
    getMediaStream: async (mediaId) => {
        return await apiConfig.get(`/api/media/${mediaId}/stream`);
    },

    /**
     * Descarga un recurso (imagen/audio) y lo expone como blob: URL.
     * Lo usan las pantallas que precargan los assets de un juego antes de empezar.
     * Nunca lanza: ante un fallo devuelve la URL original para que el <img>/<audio>
     * intente cargarla por su cuenta.
     * @param {string} url - URL del recurso
     * @param {Map} [cache] - Mapa opcional para reutilizar blobs dentro de una misma precarga
     * @returns {Promise<string|null>}
     */
    fetchAsBlobUrl: async (url, cache) => {
        if (!url) return null;
        if (cache?.has(url)) return cache.get(url);
        try {
            const response = await apiConfig.fetchAsset(url);
            const blobUrl = URL.createObjectURL(await response.blob());
            cache?.set(url, blobUrl);
            return blobUrl;
        } catch (err) {
            console.error('Failed to fetch asset', url, err);
            return url;
        }
    },

    /**
     * Sube un nuevo recurso multimedia (video/audio) con subtítulos.
     * @param {FormData} formData - Datos del formulario multipart
     * @returns {Promise<any>}
     */
    uploadMedia: async (formData) => {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiConfig.baseUrl}/api/media`, {
            method: 'POST',
            headers: {
                ...apiConfig.ngrokHeaders,
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        return apiConfig.handleResponse(response);
    }
};

export default MediaService;
