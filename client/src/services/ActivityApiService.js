// client/src/services/ActivityApiService.js
// Servicio de actividades que conecta con el API real
// Este servicio complementa ActivityService.js para operaciones con el backend

import apiConfig from './apiConfig';

class ActivityApiService {
    /**
     * Buscar juegos con filtros. Todos los filtros son opcionales y se combinan con AND.
     * GET /api/games?gameType=&difficult=&creator=&assignmentStatus=&groupId=&page=&size=&sort=
     *
     * - `gameTypes` es repetible en la query (OR entre sí).
     * - `assignmentStatus` (ASSIGNED | UNASSIGNED | NEVER_ASSIGNED) se evalúa respecto a `groupId`;
     *   sin `groupId` el backend responde 400, así que aquí se omite.
     *
     * @param {{ gameTypes?: string[], difficult?: string, creator?: string,
     *           assignmentStatus?: string, groupId?: number|string,
     *           page?: number, size?: number, sort?: string }} filters
     * @returns {Promise<Object>} - { success, data: GetGamesGameDTO[], page: {...} }
     */
    async getGames({
        gameTypes = [],
        difficult,
        creator,
        assignmentStatus,
        groupId,
        page = 0,
        size = 20,
        sort = 'title,asc',
    } = {}) {
        const hasGroup = groupId !== undefined && groupId !== null && groupId !== '';
        try {
            const params = new URLSearchParams();
            gameTypes.filter(Boolean).forEach(t => params.append('gameType', t));
            if (difficult) params.append('difficult', difficult);
            if (creator)   params.append('creator', creator);
            if (hasGroup)  params.append('groupId', groupId);
            // assignmentStatus solo tiene sentido con un grupo de referencia
            if (assignmentStatus && hasGroup) params.append('assignmentStatus', assignmentStatus);
            params.append('page', page);
            params.append('size', size);
            if (sort) params.append('sort', sort);

            const response = await apiConfig.get(`/api/games?${params.toString()}`);
            const content  = Array.isArray(response) ? response : (response?.content || []);

            return {
                success: true,
                data: content,
                page: {
                    number:        response?.number ?? page,
                    size:          response?.size ?? size,
                    totalElements: response?.totalElements ?? content.length,
                    totalPages:    response?.totalPages ?? 1,
                    last:          response?.last ?? true,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                page: { number: 0, size, totalElements: 0, totalPages: 0, last: true },
            };
        }
    }

    /**
     * Obtener actividades por tipo (vía /api/activities/{type})
     * GET /api/activities/{type}?page=#
     * @param {string} type - Tipo de actividad (FAST_MEMORY, QUIZ, INTRUDER, PUZZLE)
     * @param {number} page - Número de página
     * @returns {Promise<Object>} - Paginated Activity response
     */
    async getActivitiesByGameType(type, page = 0) {
        try {
            const response = await apiConfig.get(`/api/games/${type}?page=${page}`);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: { content: [] }
            };
        }
    }

    /**
     * Obtener juegos por tópico para el mapa
     * GET /api/games/topic/{topic}?page=#&size=#
     */
    async getGamesByTopic(topic, page = 0, size = 0) {
        try {
            const response = await apiConfig.get(`/api/games/topic/${topic}?page=${page}&size=${size}`);
            return {
                success: true,
                // Spring pagination format has { content: [...] }
                // So return the full response or a fallback
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: { content: [] }
            };
        }
    }

    /**
     * Iniciar una actividad de juego
     * POST /api/activities/start/game/{gameId}
     * @param {number} gameId - ID del juego
     * @returns {Promise<Object>} - StartGameResponseDTO
     */
    async startGame(gameId) {
        try {
            const response = await apiConfig.post(`/api/activities/start/game/${gameId}`);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener detalles de una actividad
     * GET /api/activities/{id}
     * @param {number} id - ID de la actividad
     * @returns {Promise<Object>} - DetailResultListDTO
     */
    async getActivityDetails(id) {
        try {
            const response = await apiConfig.get(`/api/activities/${id}`);
            return {
                success: true,
                data: response.detailResults || []
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
     * Obtener actividades asignadas a un grupo
     * GET /api/activities/group/{grade}
     * @param {number} grade - Grado escolar
     * @returns {Promise<Object>} - ActivityList
     */
    async getAssignedActivities(grade) {
        try {
            const response = await apiConfig.get(`/api/activities/group/${grade}`);
            return {
                success: true,
                data: response.games || []
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
     * Iniciar una actividad (Legacy - v1)
     * POST /api/activities/start/{game}
     */
    /**
     * Iniciar una actividad (Legacy - v1)
     * POST /api/activities/start/{game}
     */
    async startActivity(gameId, fromAssignment = false) {
        try {
            await apiConfig.post(`/api/activities/start/${gameId}?fromAssignment=${fromAssignment}`);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener asignaciones para un estudiante
     * GET /api/activities/student?page=#
     * @param {number} page - Número de página
     */
    async getStudentVariedActivities(page = 0) {
        try {
            const response = await apiConfig.get(`/api/activities/student?page=${page}`);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: { content: [] }
            };
        }
    }

    /**
     * Iniciar una actividad asignada para estudiante
     * POST /api/activities/start/{activityId}
     * @param {number} activityId - ID de la actividad
     */
    async startStudentActivity(activityId) {
        try {
            const response = await apiConfig.post(`/api/activities/start/${activityId}`);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Completar una actividad
     * POST /api/activities/complete
     */
    async completeActivity(data) {
        try {
            const response = await apiConfig.post('/api/activities/complete', {
                activityId: data.activityId,
                startDate: data.startDate,
                correctAnswers: data.correctAnswers,
                responseLogs: data.responseLogs || [],
                gameId: data.gameId
            });
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Puntuar una actividad
     * POST /api/activities/score
     */
    async scoreActivity(data) {
        try {
            const response = await apiConfig.post('/api/activities/score', {
                difficult: data.difficult, // EASY, MEDIUM, HARD
                totalQuestions: data.totalQuestions,
                gameConfigDTO: data.gameConfigs || []
            });
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Asignar una actividad a un grupo
     * POST /api/activities/assign
     */
    async assignActivity(gameId, groupId) {
        try {
            await apiConfig.post('/api/activities/assign', {
                gameId: gameId,
                groupId: groupId
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Recompensar a un usuario por completar una actividad
     * PATCH /api/activities/reward
     */
    async rewardActivity(username, activityId) {
        try {
            const response = await apiConfig.patch('/api/activities/reward', {
                username: username,
                activityId: activityId
            });
            return {
                success: true,
                data: {
                    xpGained: response.xpGained,
                    actualXp: response.actualXp,
                    currentLevel: response.currentLevel,
                    isLevelUp: response.isLevelUp
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteActivity(id) {
        try {
            await apiConfig.delete(`/api/activities/${id}`);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener las instancias de actividades para el grupo del maestro actual
     * GET /api/activities/instance/group
     */
    async getGroupInstances() {
        try {
            const response = await apiConfig.get('/api/activities/instance/group');
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

    /**
     * Cambiar el estado activo/inactivo de una instancia
     * PUT /api/activities/instance/{groupId}/{gameId}
     */
    async toggleInstance(groupId, gameId, state) {
        try {
            // Asumiendo que es PUT o POST, de acuerdo al estándar REST suele ser PUT/PATCH para toggle.
            const response = await apiConfig.patch(`/api/activities/instance/${groupId}/${gameId}?state=${state}`);
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener actividades activas asignadas a un grupo (para vista del maestro)
     * GET /api/activities/group/{groupId}?active=true
     * @param {number} groupId - ID del grupo (grade)
     * @param {boolean} active - Filtrar por activas/inactivas
     * @returns {Promise<Object>} - { activities: [...] }
     */
    async getActiveAssignments(groupId, active = true) {
        try {
            const response = await apiConfig.get(`/api/activities/group/${groupId}?active=${active}`);
            return {
                success: true,
                data: response.activities || []
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
     * Obtener las respuestas de un estudiante para una actividad específica
     * GET /api/games/activities/{activityId}/students/{studentUsername}/responses
     * @param {number} activityId - ID de la actividad (gameId)
     * @param {string} studentUsername - Username del estudiante
     * @returns {Promise<Object>} - Array de { questionId, responseWordId, isCorrect }
     */
    async getStudentResponses(activityId, studentUsername) {
        try {
            const response = await apiConfig.get(
                `/api/games/activities/${activityId}/students/${studentUsername}/responses`
            );
            return {
                success: true,
                data: Array.isArray(response) ? response : []
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
     * Obtener los datos del panel principal del maestro
     * GET /api/dashboard/teacher/{groupId}
     * @param {number} groupId - ID del grupo (grade)
     * @returns {Promise<Object>} - Dashboard general data
     */
    async getTeacherDashboard(groupId) {
        try {
            const response = await apiConfig.get(`/api/dashboard/teacher/${groupId}`);
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
     * Obtener los datos del panel principal del estudiante
     * GET /api/dashboard/student
     * @returns {Promise<Object>} - Dashboard student data { level, experience, inrow, pending, finished, classmates }
     */
    async getStudentDashboard() {
        try {
            const response = await apiConfig.get(`/api/dashboard/student`);
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
     * Obtener los datos del panel principal del visitante
     * GET /api/dashboard/visitor
     * @returns {Promise<Object>} - Dashboard visitor data { level, totalExperience, inrow, recentActivities, topUsers, totalActivitiesCompleted }
     */
    async getVisitorDashboard() {
        try {
            const response = await apiConfig.get(`/api/dashboard/visitor`);
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
     * Obtener la tabla de puntuaciones paginada.
     * GET /api/leaderboard?page=&size=&userType=
     *
     * El backend filtra por el tipo del usuario autenticado (estudiante ve estudiantes,
     * visitante ve visitantes) e ignora `userType`; solo maestro/admin lo usan para elegir tabla.
     * `size` máximo aceptado por el backend: 50.
     *
     * @param {{ page?: number, size?: number, userType?: 'STUDENT'|'VISITOR' }} params
     * @returns {Promise<Object>} - { success, data: LeaderboardRow[], currentUser, page: {...} }
     */
    async getLeaderboard({ page = 0, size = 20, userType } = {}) {
        const cappedSize = Math.min(size, 50);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('size', cappedSize);
            if (userType) params.append('userType', userType);

            const response = await apiConfig.get(`/api/leaderboard?${params.toString()}`);
            const content = Array.isArray(response) ? response : (response?.content || []);

            return {
                success: true,
                data: content,
                currentUser: response?.currentUser ?? null,
                page: {
                    number:        response?.number ?? page,
                    size:          response?.size ?? cappedSize,
                    totalElements: response?.totalElements ?? content.length,
                    totalPages:    response?.totalPages ?? 1,
                    last:          response?.last ?? true,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                currentUser: null,
                page: { number: 0, size: cappedSize, totalElements: 0, totalPages: 0, last: true },
            };
        }
    }
}

export default new ActivityApiService();
