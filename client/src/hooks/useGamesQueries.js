// client/src/hooks/useGamesQueries.js
// Hook compartido para el catálogo de juegos (GET /api/games con filtros + paginación).
// Lo usan la vista de actividades del admin y la de recursos del maestro.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityApiService from '../services/ActivityApiService';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const gamesKeys = {
    all:  () => ['games'],
    list: (filters = {}) => ['games', filters],
};

// ── Fetcher ───────────────────────────────────────────────────────────────────
async function fetchGames(filters) {
    const result = await ActivityApiService.getGames(filters);
    if (!result.success) throw new Error(result.error || 'Error al cargar los juegos.');
    return result; // { data: GetGamesGameDTO[], page: {...} }
}

/**
 * Juegos filtrados y paginados.
 * @param {object} filters — { gameTypes, difficult, creator, assignmentStatus, groupId, page, size, sort }
 */
export function useGamesQuery(filters = {}) {
    return useQuery({
        queryKey: gamesKeys.list(filters),
        queryFn:  () => fetchGames(filters),
        // Mantiene la página anterior visible mientras se cargan filtros nuevos (evita parpadeo).
        placeholderData: (previous) => previous,
        staleTime: 2 * 60 * 1000,
        gcTime:    10 * 60 * 1000,
    });
}

/** Invalida todas las combinaciones de filtros del catálogo. */
export function useGamesInvalidate() {
    const queryClient = useQueryClient();
    return {
        reloadGames: () => queryClient.invalidateQueries({ queryKey: gamesKeys.all() }),
    };
}
