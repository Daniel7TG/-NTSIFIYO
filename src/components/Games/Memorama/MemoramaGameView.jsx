// client/src/components/Games/Memorama/MemoramaGameView.jsx
// Fase 2 — Juego: Tablero de cartas para emparejar (Memorama clásico)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import GameSummary from '../GamePanel/GameSummary';
import GameCard from '../GameCard/GameCard';
import GameAlert from '../GamePanel/GameAlert';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/memorama/Memorama.css';

// Construir cartas a partir de words y gameConfigs
function buildCards(words, gameConfigs) {
    const cfg0 = gameConfigs[0] || { showText: true, showImage: false, playAudio: false, isMazahua: true };
    const cfg1 = gameConfigs[1] || { showText: true, showImage: false, playAudio: false, isMazahua: false };

    const cards = [];
    words.forEach((word) => {
        const wordId = word.id;

        // Carta A (cfg0)
        cards.push({
            uid: `${wordId}-A`,
            wordId,
            type: 'A',
            showText: cfg0.showText,
            showImage: cfg0.showImage,
            playAudio: cfg0.playAudio,
            isMazahua: cfg0.isMazahua,
            text: cfg0.isMazahua ? word.mazahuaWord : word.spanishWord,
            imageUrl: cfg0.showImage ? word.imageUrl : null,
            audioUrl: cfg0.playAudio ? word.audioUrl : null,
        });

        // Carta B (cfg1)
        cards.push({
            uid: `${wordId}-B`,
            wordId,
            type: 'B',
            showText: cfg1.showText,
            showImage: cfg1.showImage,
            playAudio: cfg1.playAudio,
            isMazahua: cfg1.isMazahua,
            text: cfg1.isMazahua ? word.mazahuaWord : word.spanishWord,
            imageUrl: cfg1.showImage ? word.imageUrl : null,
            audioUrl: cfg1.playAudio ? word.audioUrl : null,
        });
    });

    // Barajar
    return cards.sort(() => Math.random() - 0.5);
}

const MemoramaGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    const [loading, setLoading] = useState(true);
    const [activityXP, setActivityXP] = useState(100);

    // Estado del tablero
    const [cards, setCards] = useState([]);
    const [flippedUids, setFlippedUids] = useState([]);   // máx 2 uids seleccionados
    const [matchedWordIds, setMatchedWordIds] = useState(new Set());
    const [wrongUids, setWrongUids] = useState([]);        // animación de error
    const [lockBoard, setLockBoard] = useState(false);     // bloquear clics durante verificación
    const [attempts, setAttempts] = useState(0);           // cuántos pares se intentaron
    const [feedback, setFeedback] = useState(null);        // 'correct' | 'incorrect' | null


    const [gameState, setGameState] = useState('loading'); // loading | playing | finished | error
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);
    const feedbackTimeout = useRef(null);

    const totalPairs = cards.length / 2;

    const initGame = () => {
        setLoading(true);

        if (!currentGameData) {
            console.error('No hay datos de juego activos en el contexto.');
            setLoading(false);
            setGameState('error');
            return;
        }

        if (currentGameData.words && currentGameData.words.length > 0) {
            const sorted = currentGameData.gameConfigs
                ? [...currentGameData.gameConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                : [];
            const built = buildCards(currentGameData.words, sorted);
            setCards(built);
            setActivityXP(currentGameData.experience || 100);
            setFlippedUids([]);
            setMatchedWordIds(new Set());
            setWrongUids([]);
            setLockBoard(false);
            setAttempts(0);
            setFeedback(null);
            setElapsed(0);
            setGameState('playing');
        } else {
            console.error('La actividad de Memorama no tiene palabras.');
            setGameState('error');
        }

        setLoading(false);
    };

    // ─── Cargar datos del contexto (igual que IntrusoGameView) ────────────────
    useEffect(() => {
        initGame();
    }, [currentGameData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(feedbackTimeout.current);
        };
    }, []);

    // ─── Cronómetro ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ─── Seleccionar carta ───────────────────────────────────────────────────
    const handleCardClick = useCallback((uid, wordId) => {
        if (lockBoard) return;
        if (matchedWordIds.has(wordId)) return;          // ya emparejada
        if (flippedUids.includes(uid)) return;           // ya seleccionada
        if (flippedUids.length === 2) return;            // ya hay 2 seleccionadas

        // Reproducir audio si existe
        const card = cards.find(c => c.uid === uid);
        if (card && card.playAudio && card.audioUrl) {
            new Audio(card.audioUrl).play().catch(e => console.error('Error reproduciendo audio:', e));
        }

        const newFlipped = [...flippedUids, uid];
        setFlippedUids(newFlipped);

        if (newFlipped.length === 2) {
            const [uid1, uid2] = newFlipped;
            const wid1 = uid1.split('-')[0];
            const wid2 = uid2.split('-')[0];

            setAttempts(p => p + 1);
            setLockBoard(true);

            if (wid1 === wid2) {
                // ¡Par! Marcar como emparejadas
                setTimeout(() => {
                    setMatchedWordIds(prev => {
                        const next = new Set(prev);
                        next.add(parseInt(wid1));
                        return next;
                    });
                    setFlippedUids([]);
                    setFeedback('correct');
                }, 300);
            } else {
                // No coincide — voltear de vuelta
                setWrongUids(newFlipped);
                setFeedback('incorrect');
            }
        }
    }, [lockBoard, matchedWordIds, flippedUids, cards]);

    const handleFeedbackClose = useCallback(() => {
        if (feedback === 'correct') {
            setFeedback(null);
            setLockBoard(false);
        } else if (feedback === 'incorrect') {
            setFlippedUids([]);
            setWrongUids([]);
            setFeedback(null);
            setLockBoard(false);
        }
    }, [feedback]);

    // ─── Fin del juego ───────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState === 'playing' && totalPairs > 0 && matchedWordIds.size === totalPairs) {
            clearInterval(timerRef.current);
            setTimeout(() => setGameState('finished'), 700);
        }
    }, [matchedWordIds, totalPairs, gameState]);

    // ─── Determinar columnas del grid ────────────────────────────────────────
    const boardCols = () => {
        if (cards.length <= 8) return 'cols-4';
        return 'cols-8';
    };

    // ─── Render: Loading ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="game-loading-container">
            <div className="spinner" />
            <p style={{ color: '#1E3A8A', fontFamily: 'Poppins, sans-serif', marginTop: '1rem' }}>
                Preparando el memorama...
            </p>
        </div>
    );

    if (gameState === 'error') return (
        <div className="game-error-container">
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)', maxWidth: '380px'
            }}>
                <p style={{ fontSize: '48px', marginBottom: '1rem' }}>😕</p>
                <h2 style={{ color: '#E65100', fontFamily: 'Poppins, sans-serif' }}>Actividad no encontrada</h2>
                <p style={{ color: '#374151', margin: '0.5rem 0 1.5rem' }}>No se pudo cargar la actividad.</p>
                <button onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/memorama')} style={{
                    background: '#1E3A8A', color: 'white', padding: '0.75rem 1.5rem',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif', fontWeight: '600'
                }}>Volver</button>
            </div>
        </div>
    );

    if (gameState === 'finished') {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');

        // Generar un log único por cada pareja (palabra) usando los wordIds únicos
        const uniqueWordIds = Array.from(new Set(cards.map(c => c.wordId)));
        const finalResponseLogs = uniqueWordIds.map(wordId => {
            const card = cards.find(c => c.wordId === wordId);
            return {
                questionId: null,
                answerId: wordId,
                isCorrect: matchedWordIds.has(wordId),
                wordText: card ? card.text : ''
            };
        });

        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 5}
                startDate={new Date().toISOString()}
                correctAnswers={matchedWordIds.size}
                totalQuestions={totalPairs}
                responseLogs={finalResponseLogs}
                onExit={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/memorama')}
                onRetry={initGame}
            />
        );
    }

    const progressPercent = totalPairs > 0
        ? (matchedWordIds.size / totalPairs) * 100 : 0;

    return (
        <div className="game-container">
            {/* Barra superior */}
            <div className="game-top-bar">
                <button className="game-top-bar__back-btn" onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/memorama')} title="Salir">‹</button>
                <span className="game-top-bar__title">Memorama</span>
                <div className="game-top-bar__timer">⏱ {formatTime(elapsed)}</div>
            </div>

            {/* Barra de progreso */}
            <div className="game-progress-row">
                <div className="game-progress-bar-bg">
                    <div className="game-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="game-progress-label">
                    {matchedWordIds.size}/{totalPairs}
                </span>
            </div>

            {/* Tablero */}
            <div className={`mem-board ${boardCols()}`}>
                {cards.map(card => {
                    const isFlipped = flippedUids.includes(card.uid);
                    const isMatched = matchedWordIds.has(card.wordId);
                    const isWrong = wrongUids.includes(card.uid);

                    return (
                        <div
                            key={card.uid}
                            className={[
                                'mem-card',
                                isFlipped || isMatched ? 'flipped' : '',
                                isMatched ? 'matched' : '',
                                isWrong ? 'wrong' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => handleCardClick(card.uid, card.wordId)}
                        >
                            <div className="mem-card-inner">
                                {/* Dorso */}
                                <div className="mem-card-front">
                                    <span className="mem-card-front-icon">?</span>
                                </div>
                                {/* Frente — usa GameCard para consistencia visual */}
                                <div className="mem-card-back">
                                    <GameCard
                                        text={card.showText ? card.text : undefined}
                                        imageUrl={card.imageUrl || undefined}
                                        audioUrl={card.audioUrl || undefined}
                                        disabled={true}
                                        selected={isMatched ? 'correct' : isWrong ? 'incorrect' : null}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Instrucción */}
            <p className="mem-instruction">
                ¡Encuentra las parejas de cartas! — Intentos: {attempts}
            </p>

            {/* Feedback Alert */}
            <GameAlert
                isOpen={!!feedback}
                type={feedback}
                autoCloseDuration={900}
                onClose={handleFeedbackClose}
            />
        </div>
    );
};

export default MemoramaGameView;
