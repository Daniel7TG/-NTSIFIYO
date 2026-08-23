// client/src/hooks/usePronunciationQueries.js
// Hooks de TanStack Query para el módulo de pronunciación

import { useQuery } from '@tanstack/react-query';
import PronunciationService from '../services/PronunciationService';

export const pronunciationKeys = {
    words: () => ['pronunciation', 'words'],
};

/**
 * Palabras habilitadas para practicar pronunciación (`pronunciation: true`).
 * El barrido de temas es costoso, así que se cachea con el staleTime del QueryClient.
 */
export function usePronunciationWordsQuery() {
    return useQuery({
        queryKey: pronunciationKeys.words(),
        queryFn: async () => {
            const result = await PronunciationService.getPracticeWords();
            if (!result.success) throw new Error(result.error || 'Error al cargar las palabras.');
            return result.data;
        },
    });
}

export default usePronunciationWordsQuery;
