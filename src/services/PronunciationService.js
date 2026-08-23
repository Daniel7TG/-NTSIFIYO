// client/src/services/PronunciationService.js
// Servicio de validación de pronunciación en Mazahua (modelo ONNX del backend)

import apiConfig from './apiConfig';
import DictionaryService from './DictionaryService';
import { GAME_TOPICS } from '../utils/gameCategories';

/** Tope de páginas por tema, por si el backend nunca devolviera una página corta. */
const MAX_PAGES_PER_TOPIC = 10;

/** Tamaño de página del diccionario: una página incompleta significa "última". */
const PAGE_SIZE = 20;

/** Recorre las páginas de un tema y devuelve sólo sus palabras con pronunciación. */
async function fetchTopicWords(topic) {
    const collected = [];

    for (let page = 0; page < MAX_PAGES_PER_TOPIC; page++) {
        const result = await DictionaryService.getWordsByCategory(topic.id, page);
        if (!result.success) break;

        const words = result.data || [];
        words
            .filter(word => word.pronunciation === true)
            .forEach(word => collected.push({
                ...word,
                topicId: topic.id,
                topicLabel: topic.label
            }));

        if (words.length < PAGE_SIZE) break; // página incompleta: no hay más
    }

    return collected;
}

class PronunciationService {
    /**
     * Palabras habilitadas para practicar pronunciación (`pronunciation: true`).
     *
     * El diccionario no expone un listado filtrado, así que se recorren todos los
     * temas y se filtra en el cliente. Son pocas palabras (~43 de 150) y el
     * resultado se cachea en TanStack Query, por lo que el barrido ocurre una vez.
     *
     * @returns {Promise<{success: boolean, data: Array, error?: string}>}
     *          Cada palabra lleva `topicId`/`topicLabel` para mostrar su tema.
     */
    async getPracticeWords() {
        try {
            const perTopic = await Promise.all(GAME_TOPICS.map(fetchTopicWords));

            // Dedupe por id: una palabra podría repetirse entre páginas si el
            // backend reordena entre peticiones.
            const byId = new Map();
            perTopic.flat().forEach(word => {
                if (word?.id != null && !byId.has(word.id)) byId.set(word.id, word);
            });

            const words = Array.from(byId.values()).sort((a, b) =>
                (a.spanishWord || a.mazahuaWord || '').localeCompare(
                    b.spanishWord || b.mazahuaWord || '', 'es'
                )
            );

            return { success: true, data: words };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    /**
     * Validar la pronunciación de una palabra
     * POST /api/pronunciation/validate/{wordId}  (multipart/form-data)
     *
     * El backend convierte el audio a PCM mono 16 kHz con FFmpeg, así que acepta
     * cualquier formato que FFmpeg pueda leer (webm, ogg, mp4, wav, mp3...).
     *
     * @param {string|number} wordId - ID de la palabra que se pidió pronunciar
     * @param {Blob} audioBlob - Grabación del micrófono
     * @param {string} [filename] - Nombre con el que se envía el archivo
     * @returns {Promise<{success: boolean, data: Object|null, error?: string, status?: number}>}
     *          data: { status, score, targetWord, detectedWord, targetDistance, minDistance, threshold }
     */
    async validate(wordId, audioBlob, filename = 'grabacion.wav') {
        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('audio', audioBlob, filename);

            const response = await fetch(
                `${apiConfig.baseUrl}/api/pronunciation/validate/${wordId}`,
                {
                    method: 'POST',
                    headers: {
                        ...apiConfig.ngrokHeaders,
                        ...(token && { 'Authorization': `Bearer ${token}` })
                        // Sin Content-Type: el navegador pone el boundary del multipart
                    },
                    body: formData
                }
            );

            const data = await apiConfig.handleResponse(response);
            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error.message,
                status: error.status
            };
        }
    }
}

export default new PronunciationService();
