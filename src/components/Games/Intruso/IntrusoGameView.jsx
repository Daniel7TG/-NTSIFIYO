// client/src/components/Games/Intruso/IntrusoGameView.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import GameSummary from '../GamePanel/GameSummary';
import GameAlert from '../GamePanel/GameAlert';
import GameCard from '../GameCard/GameCard';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/intruso/Intruso.css';

const GAME_DURATION = 45; // 45 seconds

const IntrusoGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    const [activity, setActivity] = useState(null);
    const [gameConfigs, setGameConfigs] = useState([{}, {}]);
    const [loading, setLoading] = useState(true);
    const [gameState, setGameState] = useState('loading');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [feedback, setFeedback] = useState(null);

    const [correctCount, setCorrectCount] = useState(0);
    const [combo, setCombo] = useState(0);

    // Summary data
    const [responseLogs, setResponseLogs] = useState([]);
    const [startDate, setStartDate] = useState(null);

    const timerRef = useRef(null);

    const initGame = () => {
        setLoading(true);

        if (!currentGameData) {
            console.error("No hay datos de juego activos en el contexto.");
            setLoading(false);
            return;
        }

        // Read gameConfigs
        if (currentGameData.gameConfigs && currentGameData.gameConfigs.length >= 2) {
            const sorted = [...currentGameData.gameConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setGameConfigs(sorted);
        }

        if (currentGameData.questions && currentGameData.questions.length > 0) {
            // Shuffle responseList for each question so options appear in random order
            const shuffled = {
                ...currentGameData,
                questions: currentGameData.questions.map(q => ({
                    ...q,
                    responseList: [...(q.responseList || [])].sort(() => Math.random() - 0.5)
                }))
            };
            setActivity(shuffled);
            setStartDate(new Date().toISOString());
            setGameState('playing');
            setCurrentQuestionIndex(0);
            setScore(0);
            setTimeLeft(GAME_DURATION);
            setFeedback(null);
            setCorrectCount(0);
            setCombo(0);
            setResponseLogs([]);
        } else {
            console.error("La actividad de Intruso no tiene preguntas.");
        }
        setLoading(false);
    };

    useEffect(() => {
        initGame();
    }, [currentGameData]);

    // Timer Logic
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setGameState('finished');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState, timeLeft]);

    // Helper: get display text based on config
    const getWordText = (word, config) => {
        if (!word) return null;
        return config.isMazahua ? word.mazahuaWord : word.spanishWord;
    };

    const playAudio = (audioUrl) => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(() => { });
        }
    };

    const handleAnswer = (answer) => {
        if (feedback) return;

        const isCorrect = answer.isCorrect;
        const currentQuestion = activity.questions[currentQuestionIndex];
        const correctOption = currentQuestion.responseList.find(opt => opt.isCorrect);

        const config1 = gameConfigs[0] || {};
        const config2 = gameConfigs[1] || {};

        const logEntry = {
            questionId: currentQuestion.id || currentQuestionIndex,
            answerId: answer.id || null, // use ID if available
            isCorrect: isCorrect,
            questionText: currentQuestion.question,
            questionImage: config1.showImage && currentQuestion.word ? currentQuestion.word.imageUrl : null,
            questionAudio: config1.playAudio && currentQuestion.word ? currentQuestion.word.audioUrl : null,
            selectedText: config2.isMazahua && answer.word ? answer.word.mazahuaWord : (answer.answerText || (answer.word ? answer.word.spanishWord : null)),
            selectedImage: config2.showImage && answer.word ? answer.word.imageUrl : null,
            selectedAudio: config2.playAudio && answer.word ? answer.word.audioUrl : null,
            correctText: correctOption ? (config2.isMazahua && correctOption.word ? correctOption.word.mazahuaWord : (correctOption.answerText || (correctOption.word ? correctOption.word.spanishWord : null))) : null,
            correctImage: correctOption && config2.showImage && correctOption.word ? correctOption.word.imageUrl : null,
            correctAudio: correctOption && config2.playAudio && correctOption.word ? correctOption.word.audioUrl : null,
        };

        setResponseLogs(prev => [...prev, logEntry]);

        if (isCorrect) {
            const points = 100 + (combo * 10);
            setScore(prev => prev + points);
            setCorrectCount(prev => prev + 1);
            setCombo(prev => prev + 1);
            setFeedback({ type: 'correct', title: '¡Correcto!', message: '¡Bien hecho!' });
        } else {
            setCombo(0);
            setFeedback({ type: 'incorrect', title: 'Incorrecto', message: 'Ese si pertenece al grupo...' });
        }
    };

    const handleFeedbackClose = () => {
        setFeedback(null);
        if (activity.questions && currentQuestionIndex < activity.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // All questions answered — finish the game
            clearInterval(timerRef.current);
            setGameState('finished');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="game-container"><div className="spinner"></div></div>;

    if (gameState === 'finished') {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');

        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 4}
                startDate={startDate}
                correctAnswers={correctCount}
                totalQuestions={activity?.questions?.length || 0}
                responseLogs={responseLogs}
                onExit={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/estudiante/actividades')}
                onRetry={initGame}
            />
        );
    }

    if (!activity || !activity.questions) return <div>Error: Actividad inválida</div>;

    const currentQuestion = activity.questions[currentQuestionIndex];
    const config1 = gameConfigs[0] || {};
    const config2 = gameConfigs[1] || {};

    return (
        <div className="game-container">
            {/* Top Bar */}
            <div className="game-top-bar">
                <button className="game-top-bar__back-btn" onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate(-1)}>
                    ⏸
                </button>
                <div className="intruso-score-badge">
                    <span>⭐</span> {score}
                </div>
            </div>

            {/* Timer */}
            <div className="intruso-timer-container">
                <div className="intruso-timer-labels">
                    <span>Tiempo Restante</span>
                    <span>{formatTime(timeLeft)}</span>
                </div>
                <div className="intruso-timer-bar-bg">
                    <div
                        className="intruso-timer-fill"
                        style={{
                            width: `${(timeLeft / GAME_DURATION) * 100}%`,
                            background: timeLeft < 10 ? '#EF4444' : '#E65100'
                        }}
                    />
                </div>
            </div>

            {/* Question header — config1 */}
            <div className="intruso-question-header animate-pop" key={`header-${currentQuestionIndex}`}>
                <div className="intruso-category-pill">
                    Encuentra al Intruso
                </div>

                {config1.showImage && currentQuestion.word?.imageUrl && (
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                        <img src={currentQuestion.word.imageUrl} alt="Pregunta"
                            style={{ maxWidth: '120px', maxHeight: '90px', borderRadius: '12px', objectFit: 'cover' }} />
                    </div>
                )}

                {config1.playAudio && currentQuestion.word?.audioUrl && (
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                        <button onClick={() => playAudio(currentQuestion.word.audioUrl)}
                            style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button>
                    </div>
                )}

                {config1.showText && (
                    <h2 className="intruso-title">
                        {currentQuestion.question}
                    </h2>
                )}
            </div>

            {/* Grid — config2 */}
            <div className="intruso-grid">
                {currentQuestion.responseList.map((option, idx) => (
                    <GameCard
                        key={idx}
                        text={config2.showText
                            ? (config2.isMazahua && option.word
                                ? option.word.mazahuaWord
                                : (option.answerText || (option.word ? option.word.spanishWord : '')))
                            : undefined}
                        imageUrl={config2.showImage ? option.word?.imageUrl : undefined}
                        audioUrl={config2.playAudio ? option.word?.audioUrl : undefined}
                        onClick={() => handleAnswer(option)}
                        selected={
                            feedback && option.isCorrect && feedback.type === 'correct'
                                ? 'correct'
                                : feedback && !option.isCorrect && feedback.type === 'incorrect'
                                    ? 'incorrect'
                                    : null
                        }
                        disabled={!!feedback}
                        animationDelay={`${idx * 0.1}s`}
                    />
                ))}
            </div>

            {/* Feedback Overlay */}
            <GameAlert
                isOpen={!!feedback}
                type={feedback?.type}
                autoCloseDuration={1200}
                onClose={handleFeedbackClose}
            />

        </div>
    );
};

export default IntrusoGameView;
