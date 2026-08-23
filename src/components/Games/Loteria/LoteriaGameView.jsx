// client/src/components/Games/Loteria/LoteriaGameView.jsx
// Fase 2 — Juego: Baraja (izquierda) + Tabla 3×3 (derecha)
// Usa GameCard para las cartas del tablero
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import GameService from '../../../services/GameService';
import GameCard from '../GameCard/GameCard';
import GameSummary from '../GamePanel/GameSummary';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/loteria/Loteria.css';

import IconError from '../../../assets/svgs/error_cross.svg';
import IconHourglass from '../../../assets/svgs/loading_hourglass.svg';
import IconLottery from '../../../assets/svgs/juegos/loteria_premium.svg';
import IconPares from '../../../assets/svgs/juegos/pares_premium.svg';

const CARD_INTERVAL_MS = 5000;
const PENALTY_PTS = 5;
const CORRECT_PTS = 10;

/**
 * Construye la tabla (9 palabras aleatorias del pool) y la pila (todas + extras barajadas).
 * La pila incluye TODAS las palabras del pool, no solo las de la tabla.
 * Así algunas cartas que salen en la pila no estarán en la tabla (como en lotería real).
 */
function buildGameData(words, gameConfigs) {
    const cfg0 = gameConfigs[0] || { showText: true, showImage: false, playAudio: false, isMazahua: false };
    const cfg1 = gameConfigs[1] || { showText: true, showImage: false, playAudio: false, isMazahua: false };

    // Tomar los primeros 9 (o todos si hay menos) como tabla del jugador
    const boardWords = [...words].sort(() => Math.random() - 0.5).slice(0, 9);

    // La pila incluye TODOS los words disponibles mezclados aleatoriamente
    const pileWords = [...words].sort(() => Math.random() - 0.5);

    const board = boardWords.map((w) => ({
        wordId: w.id,
        text: cfg1.isMazahua ? w.mazahuaWord : w.spanishWord,
        imageUrl: cfg1.showImage ? (w.imageUrl || null) : null,
        audioUrl: cfg1.playAudio ? (w.audioUrl || null) : null,
        showText: cfg1.showText,
        showImage: cfg1.showImage,
        playAudio: cfg1.playAudio,
        isMazahua: cfg1.isMazahua,
        emoji: w.emoji || '',
    }));

    const pile = pileWords.map((w) => ({
        wordId: w.id,
        text: cfg0.isMazahua ? w.mazahuaWord : w.spanishWord,
        altText: cfg0.isMazahua ? w.spanishWord : w.mazahuaWord,
        imageUrl: cfg0.showImage ? (w.imageUrl || null) : null,
        audioUrl: cfg0.playAudio ? (w.audioUrl || null) : null,
        showText: cfg0.showText,
        showImage: cfg0.showImage,
        playAudio: cfg0.playAudio,
        isMazahua: cfg0.isMazahua,
        emoji: w.emoji || '',
    }));

    return { pile, board };
}

// ─────────────────────────────────────────────────────────────────────────────
const LoteriaGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { currentGameData } = useGame();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [activityTitle, setActivityTitle] = useState('Lotería');
    const [activityXP, setActivityXP] = useState(100);

    const [pile, setPile] = useState([]);   // baraja completa (incluyendo cartas fuera de la tabla)
    const [board, setBoard] = useState([]);   // 9 cartas de la tabla del jugador

    const [pileIndex, setPileIndex] = useState(-1);
    const [revealedIds, setRevealedIds] = useState(new Set());  // wordIds ya mencionados en la baraja
    const [matchedIds, setMatchedIds] = useState(new Set());  // wordIds seleccionados correctamente
    const [wrongIds, setWrongIds] = useState(new Set());  // para animación de error temporal
    const [score, setScore] = useState(0);
    const [penaltyCount, setPenaltyCount] = useState(0);

    // Modal de validación del botón Lotería
    const [loteriaAlert, setLoteriaAlert] = useState(null); // null | 'not_all_selected' | 'not_all_revealed'

    const [gameState, setGameState] = useState('loading'); // loading | playing | finished | error
    const [elapsed, setElapsed] = useState(0);
    const [startDate, setStartDate] = useState(null);

    const timerRef = useRef(null);
    const pileTimerRef = useRef(null);
    const pileIndexRef = useRef(-1);
    const revealedIdsRef = useRef(new Set());
    const matchedIdsRef = useRef(new Set());
    const pileRef = useRef([]);
    const boardRef = useRef([]);

    pileIndexRef.current = pileIndex;
    revealedIdsRef.current = revealedIds;
    matchedIdsRef.current = matchedIds;
    pileRef.current = pile;
    boardRef.current = board;

    // ─── Init ─────────────────────────────────────────────────────────────
    useEffect(() => {
        initGame();
        return () => {
            clearInterval(timerRef.current);
            clearInterval(pileTimerRef.current);
        };
    }, [activityId]); // eslint-disable-line

    async function initGame() {
        setLoading(true);
        setLoadError(null);

        // Cualquier excepción debe terminar en estado de error visible,
        // nunca en el spinner de carga infinito
        try {
            let data = currentGameData || null;
            if (!data) {
                const result = await GameService.startGame(parseInt(activityId));
                if (result.success && result.data) { data = result.data; }
            }

            // NO limpiar currentGameData: GameSummary lo necesita para enviar
            // el activityId real (el param de la URL es el id del juego)
            if (data?.words?.length) {
                loadFromApiData(data);
            } else {
                setLoadError('La actividad no tiene palabras configuradas.');
                setGameState('error');
            }
        } catch (e) {
            setLoadError('No se pudo cargar la actividad. Intenta de nuevo.');
            setGameState('error');
        } finally {
            setLoading(false);
        }
    }

    function loadFromApiData(data) {
        // buildGameData ya soporta menos de 9 palabras: la tabla usa las que haya
        const { pile: p, board: b } = buildGameData(data.words, data.gameConfigs || []);
        setPile(p); setBoard(b);
        setActivityTitle(data.title || '¡Lotería!');
        setActivityXP(data.experience || 100);
        setStartDate(new Date().toISOString());
        setGameState('playing');
    }

    // ─── Cronómetro ──────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    // ─── Auto-reveal de la baraja ──────────────────────────────────────────
    useEffect(() => {
        if (gameState !== 'playing' || pile.length === 0) return;
        revealNext();
        pileTimerRef.current = setInterval(revealNext, CARD_INTERVAL_MS);
        return () => clearInterval(pileTimerRef.current);
    }, [gameState, pile.length]); // eslint-disable-line

    function revealNext() {
        const next = pileIndexRef.current + 1;
        if (next >= pileRef.current.length) {
            clearInterval(pileTimerRef.current);
            return;
        }
        const card = pileRef.current[next];
        setPileIndex(next);
        setRevealedIds(prev => {
            const n = new Set(prev); n.add(card.wordId);
            revealedIdsRef.current = n; return n;
        });
        // ── NO se resalta la carta en el tablero: el jugador debe identificarla solo ──
        if (card.playAudio && card.audioUrl) {
            new Audio(card.audioUrl).play().catch(() => { });
        }
    }

    // ─── Fin del juego (cuando se presiona Lotería correctamente) ─────────
    // (ya no termina automáticamente — se requiere presionar el botón)

    // ─── Click en carta del tablero ───────────────────────────────────────
    const handleCardClick = useCallback((wordId) => {
        if (gameState !== 'playing') return;
        if (matchedIdsRef.current.has(wordId)) return; // ya seleccionada

        if (revealedIdsRef.current.has(wordId)) {
            // Correcto: la carta ya fue mencionada en la baraja
            setMatchedIds(prev => {
                const n = new Set(prev); n.add(wordId);
                matchedIdsRef.current = n; return n;
            });
            setScore(p => p + CORRECT_PTS);
        } else {
            // Penalización: la carta aún no ha sido mencionada
            setWrongIds(prev => new Set([...prev, wordId]));
            setPenaltyCount(p => p + 1);
            setScore(p => Math.max(0, p - PENALTY_PTS));
            setTimeout(() => {
                setWrongIds(prev => { const n = new Set(prev); n.delete(wordId); return n; });
            }, 700);
        }
    }, [gameState]);

    // ─── Botón ¡Lotería! ──────────────────────────────────────────────────
    const handleLoteriaButton = useCallback(() => {
        const board = boardRef.current;
        const matched = matchedIdsRef.current;
        const revealed = revealedIdsRef.current;

        const boardIds = board.map(c => c.wordId);
        const allSelected = boardIds.every(id => matched.has(id));

        if (!allSelected) {
            // El jugador aún no ha seleccionado todas sus cartas
            setLoteriaAlert('not_all_selected');
            return;
        }

        // Verificar que todas las cartas seleccionadas fueron mencionadas
        const allMentioned = boardIds.every(id => !matched.has(id) || revealed.has(id));
        if (!allMentioned) {
            setLoteriaAlert('not_all_revealed');
            return;
        }

        // ¡Todo correcto! Terminar el juego
        clearInterval(timerRef.current);
        clearInterval(pileTimerRef.current);
        setTimeout(() => setGameState('finished'), 400);
    }, []);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ─── Render: Loading ──────────────────────────────────────────────────
    if (loading) return (
        <div className="game-loading-container">
            <div className="lot-spinner" />
            <p style={{ color: '#1E3A8A', fontFamily: 'Poppins,sans-serif', marginTop: '1rem' }}>
                Cargando Lotería...
            </p>
        </div>
    );

    if (gameState === 'error') return (
        <div className="game-error-container">
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', textAlign: 'center', maxWidth: '360px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
                <p style={{ fontSize: '48px', marginBottom: '0.5rem' }}>😕</p>
                <h2 style={{ color: '#E84C0A', fontFamily: 'Poppins,sans-serif' }}>Actividad no encontrada</h2>
                <p style={{ color: '#374151', margin: '0.5rem 0 1.5rem' }}>{loadError}</p>
                <button onClick={() => navigate('/games/loteria')} style={{ background: '#1E3A8A', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', fontWeight: 700 }}>
                    Volver
                </button>
            </div>
        </div>
    );

    if (gameState === 'finished') {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');

        // Generar un log único por cada carta en la tabla
        const finalResponseLogs = board.map(card => ({
            questionId: null,
            answerId: card.wordId,
            isCorrect: matchedIds.has(card.wordId),
            wordText: card.text
        }));

        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 6}
                startDate={startDate || new Date().toISOString()}
                correctAnswers={matchedIds.size}
                totalQuestions={board.length}
                responseLogs={finalResponseLogs}
                onExit={() => navigate('/games/loteria')}
                onRetry={initGame}
            />
        );
    }

    const currentCard = pileIndex >= 0 && pileIndex < pile.length ? pile[pileIndex] : null;
    const allBoardSelected = board.length > 0 && board.every(c => matchedIds.has(c.wordId));

    return (
        <div className="game-container">

            {/* ── Barra superior ── */}
            <div className="game-top-bar">
                <button className="game-top-bar__back-btn" onClick={() => navigate('/games/loteria')} title="Salir">‹</button>
                <span className="game-top-bar__title">Lotería</span>
                <div className="game-top-bar__timer">⏱ {formatTime(elapsed)}</div>
            </div>

            {/* Fila secundaria para puntos de lotería */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: 'var(--game-max-width)', marginBottom: '0.75rem', justifyContent: 'center' }}>
                <div className="lot-badge lot-badge-points">⭐ {score} pts</div>
                {penaltyCount > 0 && (
                    <div className="lot-badge lot-badge-penalty"><img src={IconError} alt="Penalización" className="inline w-4 h-4" /> -{penaltyCount * PENALTY_PTS}</div>
                )}
            </div>

            {/* ── Área principal ── */}
            <div className="lot-main">

                {/* Columna izquierda — Baraja */}
                <div className="lot-baraja-col">
                    <span className="lot-baraja-label">Baraja</span>

                    {currentCard ? (
                        <div className="lot-baraja-card" key={pileIndex}>
                            <div className="lot-baraja-card-image-area">
                                {currentCard.showImage && currentCard.imageUrl ? (
                                    <img
                                        src={currentCard.imageUrl}
                                        alt={currentCard.text}
                                        className="lot-baraja-card-image"
                                    />
                                ) : (
                                    <span className="lot-baraja-card-emoji">{currentCard.emoji}</span>
                                )}
                            </div>
                            <div className="lot-baraja-card-footer">
                                <div className="lot-baraja-card-name">{currentCard.text}</div>
                                {currentCard.isMazahua && currentCard.altText && (
                                    <div className="lot-baraja-card-subtitle">"{currentCard.altText}"</div>
                                )}
                                {currentCard.playAudio && currentCard.audioUrl && (
                                    <button
                                        className="lot-audio-btn"
                                        style={{ margin: '8px auto 0', display: 'flex' }}
                                        onClick={() => new Audio(currentCard.audioUrl).play().catch(() => { })}
                                        title="Reproducir audio"
                                    >🔊</button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="lot-baraja-waiting">
                            <img src={IconLottery} alt="Loteria" className="w-16 h-16 drop-shadow-sm opacity-50 grayscale mx-auto mt-4" />
                            <span className="lot-baraja-waiting-text">Iniciando...</span>
                        </div>
                    )}

                    <div className="lot-find-btn">
                        {currentCard
                            ? '¡Busca esta carta en tu tabla!'
                            : 'Las cartas aparecerán pronto'}
                    </div>

                    <span className="lot-pile-counter">
                        Carta {Math.max(pileIndex + 1, 0)} de {pile.length}
                    </span>
                </div>

                {/* Columna derecha — Tabla 3×3 con GameCard */}
                <div className="lot-tabla-col">


                    <div className="lot-tabla-board">
                        <div className="lot-board-grid">
                            {board.map((card, idx) => {
                                const isMatched = matchedIds.has(card.wordId);
                                const isWrong = wrongIds.has(card.wordId);
                                // ⚠️ NO se resalta cuando sale en la baraja — el jugador debe identificar la carta
                                return (
                                    <div
                                        key={card.wordId}
                                        className={`lot-gameboard-cell ${isWrong ? 'wrong' : ''}`}
                                        onClick={() => handleCardClick(card.wordId)}
                                    >
                                        <GameCard
                                            text={card.showText ? card.text : undefined}
                                            imageUrl={card.imageUrl || undefined}
                                            audioUrl={card.audioUrl || undefined}
                                            selected={isMatched ? 'correct' : isWrong ? 'incorrect' : null}
                                            disabled={isMatched}
                                            animationDelay={`${idx * 0.04}s`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                </div>
            </div>

            {/* ── Botón ¡Lotería! ── */}
            <div className="lot-loteria-btn-row">
                <button
                    className={`lot-loteria-btn ${allBoardSelected ? '' : 'lot-loteria-btn--waiting'}`}
                    onClick={handleLoteriaButton}
                >
                    🎊 ¡Lotería!
                </button>
            </div>

            {/* ── Modal de alerta del botón Lotería ── */}
            {loteriaAlert && (
                <div className="lot-modal-overlay" onClick={() => setLoteriaAlert(null)}>
                    <div className="lot-modal" onClick={e => e.stopPropagation()}>
                        <div className="lot-modal-icon">
                            {loteriaAlert === 'not_all_selected' ? <img src={IconPares} alt="Alerta" className="w-12 h-12" /> : <img src={IconHourglass} alt="Espera" className="w-12 h-12" />}
                        </div>
                        <h3 className="lot-modal-title">
                            {loteriaAlert === 'not_all_selected'
                                ? '¡Aún no has seleccionado todas tus cartas!'
                                : '¡Algunas cartas no han sido mencionadas aún!'}
                        </h3>
                        <p className="lot-modal-desc">
                            {loteriaAlert === 'not_all_selected'
                                ? 'Selecciona todas las cartas de tu tabla antes de gritar ¡Lotería!'
                                : 'Espera a que todas tus cartas seleccionadas sean mencionadas en la baraja. ¡Continúa con el juego!'}
                        </p>
                        <button className="lot-modal-btn" onClick={() => setLoteriaAlert(null)}>
                            Continuar el juego
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LoteriaGameView;
