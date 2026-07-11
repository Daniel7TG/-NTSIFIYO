import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_CATEGORIES, GAME_TOPICS } from '../../utils/gameCategories';
import ActivityApiService from '../../services/ActivityApiService';
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

/**
 * Natural dimensions of map.webp (px).
 * All zone coordinates are expressed in this coordinate space.
 */
const MAP_NATURAL_W = 2729;
const MAP_NATURAL_H = 1521;

/**
 * Zone definitions.
 * x / y  → top-left corner of the highlight image on the base map
 * w / h  → size of the highlight image
 * categoryId must match the id used in GAME_CATEGORIES
 */
const ZONES = [
    { id: 'FOREST', img: forestHL, x: 278, y: 196, w: 542, h: 232, disabled: true },
    { id: 'PARK', img: parkHL, x: 1057, y: 920, w: 1363, h: 589 },
    { id: 'COMMUNITY', img: communityHL, x: 1791, y: 119, w: 918, h: 546 },
    { id: 'SCHOOL', img: schoolHL, x: 169, y: 832, w: 660, h: 565 },
    { id: 'CLINIC', img: clinicHL, x: 2207, y: 818, w: 502, h: 406 },
    { id: 'MARKET', img: marketHL, x: 1760, y: 642, w: 504, h: 279 },
    { id: 'KITCHEN', img: kitchenHL, x: 1047, y: 474, w: 620, h: 547 },
    { id: 'PLAIN', img: plainHL, x: 1102, y: 287, w: 656, h: 281, disabled: true },
    { id: 'FARM', img: farmHL, x: 505, y: 657, w: 551, h: 299 },
];

// BASE_PATHS replaced with central gameConfig

function GameMap() {
    const navigate = useNavigate();
    const { saveGameData } = useGame();

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTopic, setActiveTopic] = useState(null);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingGameId, setStartingGameId] = useState(null);

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
                console.error('Failed to fetch asset', url, err);
                return url;
            }
        };
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

                {/* Highlight overlays – one per zone */}
                {ZONES.map(zone => {
                    const isActive = selectedCategory && selectedCategory.id === zone.id;
                    return (
                        <img
                            key={zone.id}
                            src={zone.img}
                            alt={zone.id}
                            draggable={false}
                            loading="lazy"
                            className={`game-map-zone${isActive ? ' active' : ''}${zone.disabled ? ' disabled' : ''}`}
                            style={{
                                left: `${(zone.x / MAP_NATURAL_W) * 100}%`,
                                top: `${(zone.y / MAP_NATURAL_H) * 100}%`,
                                width: `${(zone.w / MAP_NATURAL_W) * 100}%`,
                                height: `${(zone.h / MAP_NATURAL_H) * 100}%`,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleZoneClick(zone.id);
                            }}
                        />
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
