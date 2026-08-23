// client/src/components/Games/MemoriaRapida/MemoriaRapidaGameView.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import { useCoyote } from '../../../context/CoyoteContext';
import MemoriaRapidaCard from './MemoriaRapidaCard';
import GameSummary from '../GamePanel/GameSummary';
import GameCard from '../GameCard/GameCard';
import IconSuccess from '../../../assets/svgs/success_game.svg';
import IconError from '../../../assets/svgs/error_cross.svg';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/memoriaRapida/MemoriaRapida.css';

const GAME_DURATION = 60; // segundos
const BASE_SPEED = 3500;  // ms entre tarjetas
const MIN_SPEED = 1200;   // ms mínimo
const SPEED_DECREASE = 150;

const MemoriaRapidaGameView = ({ studentId = 'student_001' }) => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    
    const { currentGameData } = useGame();
    const { triggerReaction } = useCoyote();

    const [gameState, setGameState] = useState('loading'); // loading | countdown | playing | paused | completed
    const [error, setError] = useState(null);

    const [topWords, setTopWords] = useState([]);
    const [currentTopIndex, setCurrentTopIndex] = useState(0);
    const [bottomCardProps, setBottomCardProps] = useState(null);
    const [currentMatch, setCurrentMatch] = useState(false);

    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalCards, setTotalCards] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [speed, setSpeed] = useState(BASE_SPEED);
    const [feedback, setFeedback] = useState(null); // '✅' | '❌' | null
    const [cardKey, setCardKey] = useState(0); 
    const [countdown, setCountdown] = useState(3);
    const [responseLogs, setResponseLogs] = useState([]);
    const [startDate, setStartDate] = useState(null);

    const autoTimerRef = useRef(null);

    // Refs for timer closure
    const scoreRef = useRef(0);
    const correctRef = useRef(0);
    const totalRef = useRef(0);
    const maxComboRef = useRef(0);
    const gameStateRef = useRef('loading');

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { correctRef.current = correctCount; }, [correctCount]);
    useEffect(() => { totalRef.current = totalCards; }, [totalCards]);
    useEffect(() => { maxComboRef.current = maxCombo; }, [maxCombo]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // Initialize game
    useEffect(() => {
        if (!currentGameData) {
            setError('No hay datos de juego activos en el contexto.');
            setGameState('error');
            return;
        }

        if (currentGameData.words && currentGameData.words.length > 0) {
            const shuffledWords = [...currentGameData.words].sort(() => Math.random() - 0.5);
            setTopWords(shuffledWords);
            setCurrentTopIndex(0);
            setStartDate(new Date().toISOString());
            setGameState('countdown');
        } else {
            setError('La actividad no tiene palabras.');
            setGameState('error');
        }
    }, [currentGameData]);

    // Countdown 3..2..1
    useEffect(() => {
        if (gameState !== 'countdown') return;
        if (countdown <= 0) {
            setGameState('playing');
            generateNextCard(0);
            return;
        }
        const t = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [gameState, countdown]);

    // Main timer
    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimeout(() => handleGameOverFromTimer(), 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    // Auto-skip card: al expirar el tiempo cuenta siempre como no respondida (incorrecta)
    useEffect(() => {
        if (gameState !== 'playing' || !bottomCardProps) return;
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = setTimeout(() => {
            processAnswer(null);
        }, speed);
        return () => clearTimeout(autoTimerRef.current);
    }, [bottomCardProps, gameState, speed]);

    const buildCardProps = (word, cfg) => {
        return {
            text: cfg.showText ? (cfg.isMazahua ? word.mazahuaWord : word.spanishWord) : null,
            imageUrl: cfg.showImage ? word.imageUrl : null,
            audioUrl: cfg.playAudio ? word.audioUrl : null,
        };
    };

    const generateNextCard = useCallback((topIndex) => {
        if (topIndex >= topWords.length) {
            // No more words -> end game
            setTimeout(() => handleGameOverFromTimer(), 0);
            return;
        }

        const topWord = topWords[topIndex];
        const shouldMatch = Math.random() < 0.7; // 70% match probability

        let bottomWord;
        if (shouldMatch || topWords.length === 1) {
            bottomWord = topWord;
            setCurrentMatch(true);
        } else {
            let otherWord;
            do {
                otherWord = topWords[Math.floor(Math.random() * topWords.length)];
            } while (otherWord.id === topWord.id);
            bottomWord = otherWord;
            setCurrentMatch(false);
        }

        const configs = currentGameData?.gameConfigs || [];
        const cfg1 = configs[1] || { showText: false, showImage: true, playAudio: false, isMazahua: false };

        setBottomCardProps(buildCardProps(bottomWord, cfg1));
        setCardKey(prev => prev + 1);
    }, [topWords, currentGameData]);

    // userSaysMatch: true/false = respuesta del usuario; null = tiempo agotado (siempre incorrecta)
    const processAnswer = useCallback((userSaysMatch) => {
        if (gameStateRef.current !== 'playing') return;

        clearTimeout(autoTimerRef.current);
        const isCorrect = userSaysMatch !== null && userSaysMatch === currentMatch;
        const currentTopWord = topWords[currentTopIndex];
        
        setResponseLogs(prev => [...prev, { 
            questionId: null, 
            answerId: currentTopWord.id, 
            isCorrect,
            wordText: currentTopWord.mazahuaWord || currentTopWord.spanishWord
        }]);

        setTotalCards(prev => prev + 1);

        if (isCorrect) {
            const comboMultiplier = Math.min(1 + combo * 0.1, 3);
            const pointsEarned = Math.round(100 * comboMultiplier);
            setScore(prev => prev + pointsEarned);
            setCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(mc => Math.max(mc, newCombo));
                return newCombo;
            });
            setCorrectCount(prev => prev + 1);
            setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_DECREASE));
            setFeedback('correct');
            triggerReaction('correct');
        } else {
            setCombo(0);
            setFeedback('incorrect');
            triggerReaction('incorrect');
        }

        setTimeout(() => setFeedback(null), 400);

        const nextIndex = currentTopIndex + 1;
        setCurrentTopIndex(nextIndex);
        setTimeout(() => generateNextCard(nextIndex), 350);
    }, [currentTopIndex, currentMatch, combo, topWords, generateNextCard]);

    const handleSwipe = useCallback((direction) => {
        processAnswer(direction === 'right');
    }, [processAnswer]);

    const handleCorrectBtn = () => processAnswer(true);
    const handleIncorrectBtn = () => processAnswer(false);

    const handleGameOverFromTimer = () => {
        if (gameStateRef.current === 'completed') return;
        setGameState('completed');
        clearTimeout(autoTimerRef.current);
    };

    // Reinicia todo el estado del juego (usado por "Reintentar" en GameSummary)
    const restartGame = () => {
        clearTimeout(autoTimerRef.current);
        const shuffledWords = [...(currentGameData?.words || [])].sort(() => Math.random() - 0.5);
        setTopWords(shuffledWords);
        setCurrentTopIndex(0);
        setBottomCardProps(null);
        setCurrentMatch(false);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setCorrectCount(0);
        setTotalCards(0);
        setTimeLeft(GAME_DURATION);
        setSpeed(BASE_SPEED);
        setFeedback(null);
        setResponseLogs([]);
        setCountdown(3);
        setStartDate(new Date().toISOString());
        setGameState('countdown');
    };

    const togglePause = () => {
        setGameState(prev => prev === 'paused' ? 'playing' : 'paused');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (gameState === 'error') {
        return (
            <div className="game-error-container">
                <div className="game-top-bar">
                    <button className="game-top-bar__back-btn" onClick={() => navigate(-1)}>‹</button>
                    <span className="game-top-bar__title">Error</span>
                </div>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    {error || 'No se encontraron palabras para este juego.'}
                </div>
            </div>
        );
    }

    if (gameState === 'loading') {
        return (
            <div className="game-loading-container">
                <div className="spinner" />
                <p>Cargando actividad...</p>
            </div>
        );
    }

    if (gameState === 'completed') {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');

        return <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 4}
                startDate={startDate}
                correctAnswers={correctCount}
                totalQuestions={totalCards}
                responseLogs={responseLogs}
                onExit={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/estudiante/actividades')}
                onRetry={restartGame}
            />
    }

    if (gameState === 'countdown') {
        return (
            <div className="game-container" style={{ justifyContent: 'center' }}>
                <div className="mr-countdown">
                    <p className="mr-countdown__subtitle">Memoria Rápida</p>
                    <div className="mr-countdown__circle">
                        <span className="mr-countdown__number">
                            {countdown || '🚀'}
                        </span>
                    </div>
                    <p className="mr-countdown__ready">¡Prepárate!</p>
                    <p className="mr-countdown__hint">
                        Desliza ➡️ si coincide, ⬅️ si no
                    </p>
                </div>
            </div>
        );
    }

    if (gameState === 'paused') {
        return (
            <div className="game-container" style={{ justifyContent: 'center' }}>
                <div className="mr-paused">
                    <span className="mr-paused__icon">⏸️</span>
                    <h2 className="mr-paused__title">Juego Pausado</h2>
                    <p className="mr-paused__score">
                        Puntaje actual: <strong>{score.toLocaleString()}</strong>
                    </p>
                    <button className="mr-paused__btn-continue" onClick={togglePause}>
                        ▶️ Continuar
                    </button>
                    <button className="mr-paused__btn-exit" onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate(-1)}>
                        Salir del Juego
                    </button>
                </div>
            </div>
        );
    }

    const configs = currentGameData?.gameConfigs || [];
    const cfg0 = configs[0] || { showText: true, showImage: false, playAudio: false, isMazahua: true };
    const currentTopWord = topWords[currentTopIndex];
    const topCardProps = currentTopWord ? buildCardProps(currentTopWord, cfg0) : {};

    return (
        <div className="game-container">
            {/* Top Bar */}
            <div className="game-top-bar">
                <button className="game-top-bar__back-btn" onClick={togglePause}>⏸</button>
                <span className="game-top-bar__title">
                    Memoria Rápida
                    {combo >= 2 && (
                        <span className="mr-combo-badge" style={{ marginLeft: '8px' }}>
                            {combo}x
                        </span>
                    )}
                </span>
                <div className="mr-score-area">
                    <div className="mr-score-label">Puntaje</div>
                    <div className="mr-score-value">{score.toLocaleString()}</div>
                </div>
            </div>

            {/* Timer */}
            <div className="mr-timer-row">
                <div className="mr-timer-dot" />
                <span className="mr-timer-text">⏱ {formatTime(timeLeft)}</span>
                <div className="mr-timer-bar">
                    <div
                        className={`mr-timer-fill ${timeLeft <= 10 ? 'timer-low' : ''}`}
                        style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
                    />
                </div>
            </div>

            {/* Área de juego: carta de referencia + carta deslizable
                (columna en móvil, fila en pantallas anchas) */}
            <div className="mr-play-area">
                <div className="mr-word-display">
                    {currentTopWord && (
                        <div className="mr-top-card">
                            <GameCard {...topCardProps} disabled={true} />
                        </div>
                    )}
                </div>

                <div className="mr-card-area">
                    {bottomCardProps && (
                        <MemoriaRapidaCard
                            key={cardKey}
                            cardProps={bottomCardProps}
                            onSwipe={handleSwipe}
                            disabled={gameState !== 'playing'}
                        />
                    )}

                    {/* Speed indicator */}
                    <div className="mr-speed-indicator">
                        {Math.round((1 - (speed - MIN_SPEED) / (BASE_SPEED - MIN_SPEED)) * 100)}%
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mr-action-buttons">
                <div className="mr-btn-group">
                    <button className="mr-btn-incorrect" onClick={handleIncorrectBtn}>
                        ✕
                    </button>
                    <span className="mr-btn-label incorrect">Incorrecto</span>
                </div>

                <div className="mr-btn-group">
                    <button className="mr-btn-correct" onClick={handleCorrectBtn}>
                        ✓
                    </button>
                    <span className="mr-btn-label correct">Correcto</span>
                </div>
            </div>

            {/* Mode label */}
            <div className="mr-mode-label">Modo Ritmo Rápido</div>

            {/* Feedback Flash */}
            {feedback && (
                <div className="mr-feedback-flash">
                    {feedback === 'correct' ? <img src={IconSuccess} alt="Correcto" className="w-24 h-24" /> : <img src={IconError} alt="Incorrecto" className="w-24 h-24" />}
                </div>
            )}
        </div>
    );
};

export default MemoriaRapidaGameView;