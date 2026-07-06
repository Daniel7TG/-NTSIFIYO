// client/src/components/Games/GameAccessPanel.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityApiService from '../../../services/ActivityApiService';
import { useAuth } from '../../../context/AuthContext';
import { useGame } from '../../../context/GameContext';
import Roles from '../../../utils/roles';
import ActivityCard from './ActivityCard';
import LoadingState from '../../common/LoadingState';
import { darken } from '../../../utils/colorUtils';

function GameAccessPanel({
    gameType,
    title,
    subtitle,
    gameBasePath,
    cardIcon,
    color = '#E65100',
    tipTeacher = "Crea actividades personalizadas y tus alumnos podrán jugarlas",
    tipStudent = "Juega rápido y acumula puntos para subir de nivel"
}) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { saveGameData } = useGame();
    const [activities, setActivities] = useState([]);
    const [pageData, setPageData] = useState({ totalPages: 0, number: 0, first: true, last: true });
    const [loading, setLoading] = useState(true);
    const [startingGame, setStartingGame] = useState(false);

    const userRole = (user && user.userType === Roles.TEACHER) ? 'teacher' : 'student';

    useEffect(() => {
        loadActivities(0);
    }, [gameType]);

    async function loadActivities(page = 0) {
        setLoading(true);
        const result = await ActivityApiService.getActivitiesByGameType(gameType, page);
        if (result.success) {
            setActivities(result.data.content || []);
            setPageData({
                totalPages: result.data.totalPages,
                number: result.data.number,
                first: result.data.first,
                last: result.data.last
            });
        }
        setLoading(false);
    }

    // Preload images and audio by fetching and storing as Blob URLs
    async function preloadAssets(data) {
        const cache = new Map();

        const fetchAsBlobUrl = async (url) => {
            if (!url) return null;
            if (cache.has(url)) return cache.get(url);
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                cache.set(url, blobUrl);
                return blobUrl;
            } catch (err) {
                console.error("Failed to fetch asset", url, err);
                return url; // fallback to original
            }
        };

        // Cache words
        if (data.words) {
            for (let w of data.words) {
                if (w.imageUrl) w.imageUrl = await fetchAsBlobUrl(w.imageUrl);
                if (w.audioUrl) w.audioUrl = await fetchAsBlobUrl(w.audioUrl);
            }
        }

        // Cache questions
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

    async function handlePlayGame(activityId) {
        setStartingGame(true);
        try {
            const result = await ActivityApiService.startGame(activityId);
            if (result.success) {
                // Preload all media assets before navigating
                await preloadAssets(result.data);
                // Save in memory (Context)
                saveGameData(result.data);
                // Navigate to the game
                navigate(`${gameBasePath}/jugar/${activityId}`);
            } else {
                alert(`Error al iniciar el juego: ${result.error}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setStartingGame(false);
        }
    }

    function handleCreateActivity() {
        navigate(`${gameBasePath}/crear`);
    }

    function handleEditActivity(activityId) {
        navigate(`${gameBasePath}/editar/${activityId}`);
    }

    return (
        <div className="relative animate-fade-in-up">
            {/* Encabezado */}
            <div className="flex items-center gap-4 mb-8">
                <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 border-2 border-slate-100 overflow-hidden p-2"
                    style={{ backgroundColor: color + '15' }}
                >
                    {cardIcon}
                </div>
                <div className="min-w-0">
                    <h1 className="text-3xl font-black leading-tight" style={{ color }}>{title}</h1>
                    <p className="text-gray-500 font-bold mt-0.5">{subtitle}</p>
                </div>
            </div>

            {/* Sección de crear (solo para maestros) */}
            {userRole === 'teacher' && (
                <div
                    className="kid-card-dynamic p-6 mb-8 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
                    style={{ '--card-color': color, '--card-shadow': darken(color, 0.2) }}
                >
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 border-2 border-slate-100"
                        style={{ backgroundColor: color + '15' }}
                    >✨</div>
                    <div className="flex-1">
                        <h2 className="font-black text-gray-800 text-lg">Crear Nueva Actividad</h2>
                        <p className="text-sm text-gray-500 font-medium">Diseña actividades personalizadas de {title} para tus alumnos.</p>
                    </div>
                    <button
                        onClick={handleCreateActivity}
                        className="px-6 py-3 flex items-center justify-center gap-2 text-white font-black rounded-2xl border-2 whitespace-nowrap transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                        style={{ backgroundColor: color, borderColor: darken(color, 0.15), boxShadow: `0 4px 0 ${darken(color, 0.32)}` }}
                    >
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                        Abrir Editor
                    </button>
                </div>
            )}

            {/* Actividades disponibles */}
            <h2 className="text-xl font-black text-gray-800 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color }}>sports_esports</span>
                Actividades Disponibles
            </h2>

            {loading ? (
                <LoadingState message="Cargando actividades..." />
            ) : activities.length === 0 ? (
                <div className="kid-card p-12 text-center flex flex-col items-center justify-center">
                    <span className="text-6xl block mb-4">🎒</span>
                    <h3 className="text-xl font-black text-gray-800 mb-1">No hay actividades disponibles</h3>
                    <p className="text-gray-500 font-medium">
                        {userRole === 'teacher'
                            ? 'Crea una actividad para que tus alumnos la jueguen.'
                            : 'Pide a tu maestro que cree una actividad para ti.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                userRole={userRole}
                                cardIcon={cardIcon}
                                color={color}
                                disabled={startingGame}
                                onEdit={userRole === 'teacher' ? handleEditActivity : undefined}
                                onPlay={handlePlayGame}
                            />
                        ))}
                    </div>

                    {/* Paginación */}
                    {pageData.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-10 p-4">
                            <button
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${pageData.first ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-primary border border-primary/30 hover:bg-primary/5 shadow-sm'}`}
                                onClick={() => loadActivities(pageData.number - 1)}
                                disabled={pageData.first}
                            >
                                Anterior
                            </button>
                            <span className="text-gray-600 font-medium bg-white px-4 py-2 rounded-lg shadow-sm">
                                Página {pageData.number + 1} de {pageData.totalPages}
                            </span>
                            <button
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${pageData.last ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-primary border border-primary/30 hover:bg-primary/5 shadow-sm'}`}
                                onClick={() => loadActivities(pageData.number + 1)}
                                disabled={pageData.last}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Footer */}
            <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
                <span className="material-symbols-outlined text-lg" style={{ color }}>lightbulb</span>
                Tip: {userRole === 'teacher' ? tipTeacher : tipStudent}
            </div>
        </div>
    );
}

export default GameAccessPanel;
