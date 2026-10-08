import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_CATEGORIES, GAME_TOPICS } from '../../utils/gameCategories';
import ActivityApiService from '../../services/ActivityApiService';
import MediaService from '../../services/MediaService';
import { useGame } from '../../context/GameContext';
import { getGameBasePath } from '../../config/activityConfig';
import mapDesktopXl from '../../assets/map/map-desktop-xl.webp';
import mapDesktop from '../../assets/map/map-desktop.webp';
import mapDesktopSm from '../../assets/map/map-desktop-sm.webp';
import mapTablet from '../../assets/map/map-tablet.webp';
import mapMobileLandscape from '../../assets/map/map-mobile-landscape.webp';
import mapMobile from '../../assets/map/map-mobile.webp';
import mapMobileSm from '../../assets/map/map-mobile-sm.webp';
import kitchenHL from '../../assets/map/kitchen.webp';
import farmHL from '../../assets/map/farm.webp';
import parkHL from '../../assets/map/park.webp';
import clinicHL from '../../assets/map/clinic.webp';
import marketHL from '../../assets/map/market.webp';
import schoolHL from '../../assets/map/school.webp';
import forestHL from '../../assets/map/forest.webp';
import plainHL from '../../assets/map/plain.webp';
import communityHL from '../../assets/map/community.webp';
import '../../styles/components/map/GameMap.css';
import mapGeometry from './mapGeometry.json';

/**
 * Natural dimensions of map.webp (px).
 * All zone coordinates are expressed in this coordinate space.
 */
const MAP_NATURAL_W = 5516;
const MAP_NATURAL_H = 3072;

/**
 * Zone definitions.
 * x / y  → top-left corner of the highlight image on the base map
 * w / h  → size of the highlight image
 * categoryId must match the id used in GAME_CATEGORIES
 */
// Coordenadas y contornos recuperados de las capas originales sin recortar.
const ZONES = [
    { id: 'FOREST', img: forestHL, disabled: true },
    { id: 'PARK', img: parkHL },
    { id: 'COMMUNITY', img: communityHL },
    { id: 'SCHOOL', img: schoolHL },
    { id: 'CLINIC', img: clinicHL },
    { id: 'MARKET', img: marketHL },
    { id: 'KITCHEN', img: kitchenHL },
    { id: 'PLAIN', img: plainHL, disabled: true },
    { id: 'FARM', img: farmHL },
].map(zone => ({ ...zone, ...mapGeometry[zone.id] }));

// BASE_PATHS replaced with central gameConfig

function GameMap() {
    const navigate = useNavigate();
    const { saveGameData } = useGame();

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTopic, setActiveTopic] = useState(null);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingGameId, setStartingGameId] = useState(null);
    const [starsByGameId, setStarsByGameId] = useState({});
    const [starsLoading, setStarsLoading] = useState(true);
    const [starsAvailable, setStarsAvailable] = useState(false);
    const [mapGameCatalog, setMapGameCatalog] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogAvailable, setCatalogAvailable] = useState(false);

    useEffect(() => {
        let active = true;
        const loadStars = async () => {
            const result = await ActivityApiService.getMyGameStars();
            if (!active) return;
            setStarsAvailable(result.success);
            const next = {};
            (result.data || []).forEach(row => {
                const total = Number(row.max_puntuation) || 0;
                const correct = Number(row.puntuation) || 0;
                if (row.gameId != null && total > 0) {
                    next[row.gameId] = Math.max(0, Math.min(5, Math.floor(5 * correct / total)));
                }
            });
            setStarsByGameId(next);
            setStarsLoading(false);
        };
        loadStars();
        window.addEventListener('game-stars-updated', loadStars);
        Promise.all(GAME_TOPICS.map(topic => ActivityApiService.getGamesByTopic(topic.id, 0, 100)))
            .then(results => {
                if (!active) return;
                const uniqueGames = new Map();
                results.forEach(result => (result.data?.content || []).forEach(game => uniqueGames.set(game.id, game)));
                setCatalogAvailable(results.every(result => result.success));
                setMapGameCatalog([...uniqueGames.values()]);
            })
            .finally(() => { if (active) setCatalogLoading(false); });
        return () => {
            active = false;
            window.removeEventListener('game-stars-updated', loadStars);
        };
    }, []);

    const earnedStars = games.reduce((sum, game) => sum + (starsByGameId[game.id] || 0), 0);
    const possibleStars = games.length * 5;
    const completedGames = games.filter(game => starsByGameId[game.id] != null).length;
    const topicProgress = possibleStars > 0 ? Math.round(earnedStars / possibleStars * 100) : 0;
    const mapEarnedStars = mapGameCatalog.reduce((sum, game) => sum + (starsByGameId[game.id] || 0), 0);
    const mapPossibleStars = mapGameCatalog.length * 5;
    const mapCompletedGames = mapGameCatalog.filter(game => starsByGameId[game.id] != null).length;
    const mapProgress = mapPossibleStars > 0 ? Math.round(mapEarnedStars / mapPossibleStars * 100) : 0;

    // Get topics for the currently selected category
    const categoryTopics = selectedCategory
        ? GAME_TOPICS.filter(t => t.categoryId === selectedCategory.id)
        : [];

    // When a category is opened, automatically select the first topic
    useEffect(() => {
        if (selectedCategory && categoryTopics.length > 0) {
            setActiveTopic(categoryTopics[0].id);
        }
    }, [selectedCategory]);

    // When the active topic changes, fetch games
    useEffect(() => {
        if (!activeTopic) return;
        async function fetchGames() {
            setLoading(true);
            const result = await ActivityApiService.getGamesByTopic(activeTopic, 0, 0);
            if (result.success && result.data && result.data.content) {
                setGames(result.data.content);
            } else {
                setGames([]);
            }
            setLoading(false);
        }
        fetchGames();
    }, [activeTopic]);

    // Preload media assets for a game before navigation
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

    const handlePlayGame = async (game) => {
        const basePath = getGameBasePath(game.gameType);
        if (!basePath || basePath === '/dashboard') {
            alert('Tipo de juego desconocido o no configurado: ' + game.gameType);
            return;
        }

        setStartingGameId(game.id);
        try {
            const result = await ActivityApiService.startGame(game.id);
            if (result.success && result.data) {
                await preloadAssets(result.data);
                saveGameData(result.data);
                navigate(`${basePath}/jugar/${game.id}`, { state: { returnToMap: true } });
            } else {
                alert(`Error al iniciar el juego: ${result.error}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error al iniciar el juego');
        } finally {
            setStartingGameId(null);
        }
    };

    function getDifficultyLabel(diff) {
        const map = { EASY: 'Fácil', MEDIUM: 'Medio', HARD: 'Difícil' };
        return map[diff] || diff;
    }

    const handleZoneClick = (zoneId) => {
        const zone = ZONES.find(z => z.id === zoneId);
        if (zone && zone.disabled) {
            alert('Esta zona aún está en desarrollo. ¡Vuelve pronto!');
            return;
        }
        const cat = GAME_CATEGORIES.find(c => c.id === zoneId);
        if (cat) {
            setSelectedCategory(cat);
        }
    };

    const handleMapClick = () => {
        // Clicking the bare map deselects any active zone but does NOT close the popup
        // The popup has its own close mechanism
    };

    return (
        <div className="game-map-wrapper">
            {/* ── Map canvas ─────────────────────────────────────────── */}
            <div className="game-map-canvas" onClick={handleMapClick}>
                {/* Base map - responsive with priority loading */}
                <picture>
                    {/* <source srcSet={mapMobileSm} media="(max-width: 480px)" /> */}
                    {/* <source srcSet={mapMobile} media="(max-width: 640px)" /> */}
                    <source srcSet={mapMobileLandscape} media="(max-width: 768px)" />
                    <source srcSet={mapTablet} media="(max-width: 1024px)" />
                    <source srcSet={mapDesktopSm} media="(max-width: 1440px)" />
                    <source srcSet={mapDesktop} media="(max-width: 1920px)" />
                    <img
                        src={mapDesktopXl}
                        alt="Mapa del juego"
                        className="game-map-base"
                        draggable={false}
                        fetchpriority="high"
                    />
                </picture>

                <div className="map-global-progress" aria-live="polite">
                    <span className="material-symbols-outlined">emoji_events</span>
                    <div>
                        <strong>Progreso del mapa</strong>
                        <span>{catalogLoading || starsLoading ? 'Cargando progreso…' : !catalogAvailable || !starsAvailable ? 'Progreso no disponible' : `${mapCompletedGames}/${mapGameCatalog.length} actividades · ${mapEarnedStars}/${mapPossibleStars} estrellas`}</span>
                    </div>
                    <b>{catalogLoading || starsLoading || !mapPossibleStars || !catalogAvailable || !starsAvailable ? '—' : `${mapProgress}%`}</b>
                </div>

                {/* Highlight overlays – one per zone */}
                {ZONES.map(zone => {
                    const isActive = selectedCategory && selectedCategory.id === zone.id;
                    return (
                        <button
                            key={zone.id}
                            type="button"
                            aria-label={GAME_CATEGORIES.find(category => category.id === zone.id)?.label || zone.id}
                            aria-disabled={Boolean(zone.disabled)}
                            aria-haspopup="dialog"
                            className={`game-map-zone${isActive ? ' active' : ''}${zone.disabled ? ' disabled' : ''}`}
                            style={{
                                clipPath: zone.clipPath,
                                left: `${(zone.x / MAP_NATURAL_W) * 100}%`,
                                top: `${(zone.y / MAP_NATURAL_H) * 100}%`,
                                width: `${(zone.w / MAP_NATURAL_W) * 100}%`,
                                height: `${(zone.h / MAP_NATURAL_H) * 100}%`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleZoneClick(zone.id);
                            }}
                        >
                            <img src={zone.img} alt="" draggable={false} />
                        </button>
                    );
                })}
            </div>

            {/* ── Popup ─────────────────────────────────────────────── */}
            {selectedCategory && (
                <div className="map-popup-overlay" onClick={() => setSelectedCategory(null)}>
                    <div className="map-popup-content" onClick={e => e.stopPropagation()}>
                        <button className="map-popup-close" onClick={() => setSelectedCategory(null)}>✕</button>

                        <div className="map-popup-header">
                            <h2 className="map-popup-title">{selectedCategory.label}</h2>
                            {activeTopic && (
                                <div className="map-progress-summary" aria-live="polite">
                                    <div className="map-progress-copy">
                                    <span>{starsLoading ? 'Cargando progreso…' : !starsAvailable ? 'Progreso no disponible' : `${GAME_TOPICS.find(topic => topic.id === activeTopic)?.label || 'Tema'}: ${completedGames} de ${games.length} actividades · ${earnedStars} de ${possibleStars} estrellas`}</span>
                                        <strong>{possibleStars ? `${topicProgress}%` : '—'}</strong>
                                    </div>
                                    <div className="map-progress-track"><span style={{ width: `${topicProgress}%` }} /></div>
                                </div>
                            )}
                            <div className="map-tabs-container">
                                {categoryTopics.map(topic => (
                                    <div
                                        key={topic.id}
                                        className={`map-tab ${activeTopic === topic.id ? 'active' : ''}`}
                                        onClick={() => setActiveTopic(topic.id)}
                                    >
                                        {topic.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="map-popup-body">
                            {loading ? (
                                <div className="map-loading">Cargando actividades...</div>
                            ) : games.length === 0 ? (
                                <div className="map-empty">No hay actividades disponibles para este tema.</div>
                            ) : (
                                <div className="map-game-list">
                                    {games.map(game => (
                                        <div key={game.id} className="map-game-card">
                                            <div className="map-game-info">
                                                <h3 className="map-game-title">{game.title}</h3>
                                                <p className="map-game-desc">{game.description}</p>
                                                <div className="map-game-stars" aria-label={`${starsByGameId[game.id] || 0} de 5 estrellas`}>
                                                    {Array.from({ length: 5 }, (_, index) => <span key={index} className={`material-symbols-outlined${index < (starsByGameId[game.id] || 0) ? ' earned' : ''}`}>star</span>)}
                                                    <span className="map-game-star-count">{starsAvailable ? `${starsByGameId[game.id] || 0}/5` : '—'}</span>
                                                </div>
                                                <span className={`map-game-difficulty diff-${game.difficult}`}>
                                                    {getDifficultyLabel(game.difficult)}
                                                </span>
                                            </div>
                                            <div className="map-game-actions">
                                                <div className="map-game-questions">
                                                    🎯 {game.totalQuestions || 0} ítems
                                                </div>
                                                <button
                                                    className="map-game-btn"
                                                    disabled={startingGameId === game.id}
                                                    onClick={() => handlePlayGame(game)}
                                                >
                                                    {startingGameId === game.id ? 'Cargando...' : '▶ Comenzar'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GameMap;
