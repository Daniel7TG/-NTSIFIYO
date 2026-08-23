// client/src/components/Games/Rompecabezas/RompecabezasGameView.js
// Vista de juego de Rompecabezas — Fase 2: Juego (con API real)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import GameSummary from '../GamePanel/GameSummary';
import GameAlert from '../GamePanel/GameAlert';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/rompecabezas/Rompecabezas.css';

const RompecabezasGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    // ─── Estado general ────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [activityTitle, setActivityTitle] = useState('Rompecabezas');

    // Configuraciones de display (del servidor)
    // gameConfigs[0] → cómo mostrar el TÍTULO; gameConfigs[1] → RESPUESTAS
    const [gameConfigs, setGameConfigs] = useState([
        { showText: true, showImage: false, playAudio: false, isMazahua: false },
        { showText: true, showImage: false, playAudio: false, isMazahua: false }
    ]);

    // Cola de preguntas (incluye reintentos al final)
    const [questionQueue, setQuestionQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalOriginal, setTotalOriginal] = useState(5);
    const [completedOriginal, setCompletedOriginal] = useState(0);

    const [selectedOption, setSelectedOption] = useState(null);
    const [feedback, setFeedback] = useState(null); // null | 'correct' | 'incorrect'
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState('loading'); // loading | playing | finished | error
    const [elapsed, setElapsed] = useState(0);
    const [failedOnFirst, setFailedOnFirst] = useState(new Set());

    // Summary data
    const [responseLogs, setResponseLogs] = useState([]);
    const [startDate, setStartDate] = useState(null);

    const timerRef = useRef(null);
    const feedbackTimeout = useRef(null);

    // ─── Cargar juego desde el contexto ────────────────────────────────────
    useEffect(() => {
        initGame();
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(feedbackTimeout.current);
        };
    }, [currentGameData]);

    function initGame() {
        setLoading(true);
        setLoadError(null);

        if (currentGameData) {
            loadFromApiData(currentGameData);
            setScore(0);
            setCurrentIndex(0);
            setCompletedOriginal(0);
            setFailedOnFirst(new Set());
            setResponseLogs([]);
            setElapsed(0);
            setFeedback(null);
            setSelectedOption(null);
        } else {
            console.warn('API no disponible, faltan datos de juego en el contexto.');
            setLoadError('No se encontró la actividad iniciada. Por favor, vuelve al panel.');
            setGameState('error');
        }

        setLoading(false);
    }

    /** Mapea la respuesta de la API al estado del juego */
    function loadFromApiData(data) {
        const questions = (data.questions || []).map(q => ({
            id: q.id,
            question: q.question,
            word: q.word || null,
            responseList: shuffleArray([...(q.responseList || [])].map(r => ({ ...r })))
        }));

        if (questions.length === 0) {
            setLoadError('La actividad no tiene preguntas disponibles.');
            setGameState('error');
            return;
        }

        if (data.gameConfigs && data.gameConfigs.length >= 2) {
            const sorted = [...data.gameConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setGameConfigs(sorted);
        }

        setQuestionQueue(questions);
        setTotalOriginal(questions.length);
        setActivityTitle('Rompecabezas');
        setStartDate(new Date().toISOString());
        setGameState('playing');
    }

    const playAudio = (audioUrl) => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(() => { });
        }
    };

    // ─── Cronómetro ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    function shuffleArray(arr) {
        return arr.sort(() => Math.random() - 0.5);
    }

    // ─── Seleccionar opción ─────────────────────────────────────────────────
    const handleSelectOption = (option) => {
        if (feedback !== null) return;
        setSelectedOption(option);
    };

    const handleCheck = useCallback(() => {
        if (!selectedOption || feedback !== null) return;

        const isCorrect = selectedOption.isCorrect;
        const currentQ = questionQueue[currentIndex];

        // Find the correct option for logging
        const correctOption = currentQ.responseList.find(opt => opt.isCorrect);

        const logEntry = {
            questionId: currentQ.id || currentIndex, // Use ID if available, else index
            answerId: selectedOption.id || null,     // Try to use ID if available
            isCorrect: isCorrect,
            questionText: gameConfigs[0]?.isMazahua && currentQ.word ? currentQ.word.mazahuaWord : currentQ.question,
            questionImage: gameConfigs[0]?.showImage && currentQ.word ? currentQ.word.imageUrl : null,
            questionAudio: gameConfigs[0]?.playAudio && currentQ.word ? currentQ.word.audioUrl : null,
            selectedText: gameConfigs[1]?.isMazahua && selectedOption.word ? selectedOption.word.mazahuaWord : selectedOption.answerText,
            selectedImage: gameConfigs[1]?.showImage && selectedOption.word ? selectedOption.word.imageUrl : null,
            selectedAudio: gameConfigs[1]?.playAudio && selectedOption.word ? selectedOption.word.audioUrl : null,
            correctText: correctOption ? (gameConfigs[1]?.isMazahua && correctOption.word ? correctOption.word.mazahuaWord : correctOption.answerText) : null,
            correctImage: correctOption && gameConfigs[1]?.showImage && correctOption.word ? correctOption.word.imageUrl : null,
            correctAudio: correctOption && gameConfigs[1]?.playAudio && correctOption.word ? correctOption.word.audioUrl : null,
        };

        setResponseLogs(prev => [...prev, logEntry]);

        if (isCorrect) {
            setFeedback('correct');
            if (!failedOnFirst.has(currentIndex)) {
                setScore(prev => prev + 1);
            }
        } else {
            setFeedback('incorrect');
            if (!failedOnFirst.has(currentIndex)) {
                setFailedOnFirst(prev => new Set([...prev, currentIndex]));
            }
        }
    }, [selectedOption, feedback, questionQueue, currentIndex, failedOnFirst, totalOriginal, gameConfigs]);

    const handleFeedbackClose = () => {
        setFeedback(null);
        setSelectedOption(null);
        const nextIndex = currentIndex + 1;
        setCompletedOriginal(prev => Math.min(prev + 1, totalOriginal));

        if (nextIndex >= totalOriginal) {
            setGameState('finished');
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    // ─── Progreso ────────────────────────────────────────────────────────────
    const progressPercent = totalOriginal > 0
        ? (Math.min(completedOriginal, totalOriginal) / totalOriginal) * 100 : 0;
    const questionLabel = Math.min(completedOriginal + 1, totalOriginal);

    // ─── Render: Loading ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="game-loading-container">
                <div className="spinner" />
                <p style={{ color: '#1E3A8A', fontFamily: 'Poppins, sans-serif', marginTop: '1rem' }}>
                    Cargando rompecabezas...
                </p>
            </div>
        );
    }

    // ─── Render: Error ────────────────────────────────────────────────────────
    if (gameState === 'error') {
        return (
            <div className="game-error-container">
                <div style={{
                    background: 'white', padding: '2rem', borderRadius: '15px',
                    textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxWidth: '400px'
                }}>
                    <p style={{ fontSize: '48px', marginBottom: '1rem' }}>😕</p>
                    <h2 style={{ color: '#E65100', fontFamily: 'Poppins, sans-serif', marginBottom: '0.5rem' }}>
                        Actividad no encontrada
                    </h2>
                    <p style={{ color: '#374151', marginBottom: '1.5rem' }}>{loadError}</p>
                    <button
                        onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/rompecabezas')}
                        style={{
                            background: '#1E3A8A', color: 'white', padding: '0.75rem 1.5rem',
                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                            fontFamily: 'Poppins, sans-serif', fontWeight: '600'
                        }}>
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // ─── Render: Final ────────────────────────────────────────────────────────
    if (gameState === 'finished') {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');

        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 2}
                startDate={startDate}
                correctAnswers={score}
                totalQuestions={totalOriginal}
                responseLogs={responseLogs}
                onExit={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/rompecabezas')}
                onRetry={initGame}
            />
        );
    }

    const currentQuestion = questionQueue[currentIndex];


    return (
        <div className="game-container">
            {/* ── Barra superior ── */}
            <div className="game-top-bar">
                <button className="game-top-bar__back-btn" onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/rompecabezas')} title="Salir">
                    ‹
                </button>
                <span className="game-top-bar__title">{activityTitle}</span>
                <button className="rp-help-btn" title="Ayuda">?</button>
            </div>

            {/* ── Barra de progreso ── */}
            <div className="game-progress-row">
                <div className="game-progress-bar-bg">
                    <div className="game-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="game-progress-label">{questionLabel}/{totalOriginal}</span>
            </div>

            {/* ── Instrucción ── */}
            <div className="rp-instruction">
                Completa la frase
            </div>

            {/* ── Piezas superiores (pregunta + slot) ── */}
            <div className="rp-question-area" key={`q-${currentIndex}`}>
                {/* Pieza con la pregunta — config1 */}
                <div className="rp-piece rp-piece-question" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    {gameConfigs[0]?.showImage && currentQuestion.word?.imageUrl && (
                        <img src={currentQuestion.word.imageUrl} alt=""
                            style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
                    )}
                    {gameConfigs[0]?.showText && (
                        <span>{gameConfigs[0]?.isMazahua && currentQuestion.word
                            ? currentQuestion.word.mazahuaWord
                            : currentQuestion.question}</span>
                    )}
                    {gameConfigs[0]?.playAudio && currentQuestion.word?.audioUrl && (
                        <button onClick={() => playAudio(currentQuestion.word.audioUrl)}
                            style={{ fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button>
                    )}
                </div>

                {/* Slot para la respuesta — config2 */}
                <div className={`rp-piece-slot ${selectedOption ? 'filled' : ''}`}>
                    {selectedOption ? (
                        <span style={{
                            fontSize: '16px', fontWeight: '700',
                            color: feedback === 'correct' ? '#065F46'
                                : feedback === 'incorrect' ? '#7F1D1D'
                                    : '#5D3A00',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                        }}>
                            {gameConfigs[1]?.showImage && selectedOption.word?.imageUrl && (
                                <img src={selectedOption.word.imageUrl} alt=""
                                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                            )}
                            {gameConfigs[1]?.showText && (
                                gameConfigs[1]?.isMazahua && selectedOption.word
                                    ? selectedOption.word.mazahuaWord
                                    : selectedOption.answerText
                            )}
                        </span>
                    ) : (
                        <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)' }}>+</span>
                    )}
                </div>
            </div>

            {/* ── Opciones — config2 ── */}
            <div className="rp-options-section">
                <div className="rp-options-grid">
                    {currentQuestion.responseList.map((option, idx) => {
                        let extraClass = '';
                        if (feedback && selectedOption?.answerText === option.answerText) {
                            extraClass = feedback === 'correct' ? 'correct' : 'incorrect';
                        } else if (feedback === 'incorrect' && option.isCorrect) {
                            extraClass = 'correct';
                        }
                        const isSelected = selectedOption?.answerText === option.answerText;

                        return (
                            <button
                                key={idx}
                                className={`rp-option-piece ${isSelected && !feedback ? 'selected' : ''} ${extraClass}`}
                                onClick={() => handleSelectOption(option)}
                                disabled={!!feedback}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                            >
                                {gameConfigs[1]?.showImage && option.word?.imageUrl && (
                                    <img src={option.word.imageUrl} alt=""
                                        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                )}
                                {gameConfigs[1]?.showText && (
                                    <span className="rp-option-text">
                                        {gameConfigs[1]?.isMazahua && option.word
                                            ? option.word.mazahuaWord
                                            : option.answerText}
                                    </span>
                                )}
                                {gameConfigs[1]?.playAudio && option.word?.audioUrl && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playAudio(option.word.audioUrl); }}
                                        style={{ fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >🔊</button>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Botón Comprobar ── */}
            <button
                className="rp-check-btn"
                onClick={handleCheck}
                disabled={!selectedOption || !!feedback}
            >
                Comprobar Respuesta
            </button>

            {/* ── Feedback Banner ── */}
            <GameAlert
                isOpen={!!feedback}
                type={feedback}
                autoCloseDuration={1200}
                onClose={handleFeedbackClose}
            />

            {/* ── Cronómetro (esquina superior derecha) ── */}
            <div style={{
                position: 'fixed', top: '14px', right: '70px',
                fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)',
                fontVariantNumeric: 'tabular-nums'
            }}>
                ⏱ {formatTime(elapsed)}
            </div>
        </div>
    );
};

export default RompecabezasGameView;
