import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityApiService from '../../services/ActivityApiService';
import MediaService from '../../services/MediaService';
import ActivityCard from '../../components/Games/GamePanel/ActivityCard';
import { useGame } from '../../context/GameContext';
import { useAlert } from '../../context/AlertContext';
import SectionHeader from '../../components/common/SectionHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import PageShell from '../../components/common/PageShell';
import { useStudentAssignmentsQuery, useStudentInvalidate } from '../../hooks/useStudentQueries';
import { getGameBasePath, getGameIcon } from '../../config/activityConfig';

const StudentAssignments = () => {
    const navigate = useNavigate();
    const { saveGameData } = useGame();
    const { showAlert, hideAlert } = useAlert();

    const [page, setPage] = useState(0);
    const { data, isLoading, error } = useStudentAssignmentsQuery(page);
    const { reloadAssignments } = useStudentInvalidate();

    const activities = data?.activities || [];
    const pageData = data?.pageData || { totalPages: 0, number: 0, first: true, last: true };

    // Preload images and audio
    async function preloadAssets(data) {
        const cache = new Map();
        const fetchAsBlobUrl = (url) => MediaService.fetchAsBlobUrl(url, cache);

        if (data.words) {
            for (let w of data.words) {
                if (w.imageUrl) w.imageUrl = await fetchAsBlobUrl(w.imageUrl);
                if (w.audioUrl) w.audioUrl = await fetchAsBlobUrl(w.audioUrl);
            }
        }
        if (data.questions) {
            for (let q of data.questions) {
                if (q.word) {
                    if (q.word.imageUrl) q.word.imageUrl = await fetchAsBlobUrl(q.word.imageUrl);
                    if (q.word.audioUrl) q.word.audioUrl = await fetchAsBlobUrl(q.word.audioUrl);
                }
                if (q.responseList) {
                    for (let r of q.responseList) {
                        if (r.word) {
                            if (r.word.imageUrl) r.word.imageUrl = await fetchAsBlobUrl(r.word.imageUrl);
                            if (r.word.audioUrl) r.word.audioUrl = await fetchAsBlobUrl(r.word.audioUrl);
                        }
                    }
                }
            }
        }
    }

    async function handlePlayGame(activityId, gameType) {
        const selectedActivity = activities.find(a => a.id === activityId);
        showAlert({
            mode: 'loading',
            title: 'Preparando Actividad',
            message: `Estamos cargando "${selectedActivity?.title || 'la actividad'}" y descargando el contenido multimedia necesario para que juegues sin interrupciones. Por favor espera un momento...`,
            icon: 'hourglass_empty',
            isClosable: false
        });
        try {
            const result = await ActivityApiService.startStudentActivity(activityId);
            if (result.success) {
                await preloadAssets(result.data);
                saveGameData(result.data);
                const basePath = getGameBasePath(gameType);
                hideAlert();
                navigate(`${basePath}/jugar/${activityId}`);
            } else {
                hideAlert();
                showAlert({ mode: 'error', title: 'Error de Carga', message: `Ocurrió un error al preparar la actividad: ${result.error}`, isClosable: true });
            }
        } catch (err) {
            console.error(err);
            hideAlert();
            showAlert({ mode: 'error', title: 'Error Inesperado', message: 'No pudimos conectarnos con el servidor. Verifica tu conexión e inténtalo nuevamente.', isClosable: true });
        }
    }

    return (
        <PageShell>
            <SectionHeader
                title="Tus Asignaciones"
                subtitle="Completa las actividades asignadas por tu maestro para ganar experiencia"
                onReload={() => reloadAssignments(page)}
            />

            <div>
                {isLoading ? (
                    <LoadingState message="Cargando tus asignaciones..." />
                ) : error ? (
                    <ErrorState
                        message={error.message}
                        onRetry={() => reloadAssignments(page)}
                        dashboardPath="/dashboard"
                    />
                ) : activities.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <span className="text-6xl block mb-4">📚</span>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Todo al día!</h3>
                        <p className="text-gray-500 text-lg">No tienes nuevas asignaciones pendientes.</p>
                        <p className="text-gray-400 mt-4">Explora otras actividades para seguir aprendiendo.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activities.map((activity) => (
                                <ActivityCard
                                    key={activity.id}
                                    activity={activity}
                                    userRole="student"
                                    cardIcon={getGameIcon(activity.gameType)}
                                    onPlay={(id) => handlePlayGame(id, activity.gameType)}
                                />
                            ))}
                        </div>

                        {pageData.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-10 p-4">
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${pageData.first ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-primary border border-primary/30 hover:bg-primary/5 shadow-sm'}`}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={pageData.first}
                                >
                                    Anterior
                                </button>
                                <span className="text-gray-600 font-medium bg-white px-4 py-2 rounded-lg shadow-sm">
                                    Página {pageData.number + 1} de {pageData.totalPages}
                                </span>
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${pageData.last ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-primary border border-primary/30 hover:bg-primary/5 shadow-sm'}`}
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={pageData.last}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageShell>
    );
};

export default StudentAssignments;
