// clment/src/components/Games/quiz/QuizGameView.js
// Vista de juego de quiz para estudiantes
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import IconHourglass from '../../../assets/svgs/loading_hourglass.svg';
import IconQuiz from '../../../assets/svgs/juegos/quiz_premium.svg';
import GameSummary from '../GamePanel/GameSummary';
import GameAlert from '../GamePanel/GameAlert';
import GameCard from '../GameCard/GameCard';
import '../../../styles/components/games/quiz/Quiz.css';

function QuizGameView() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    const [activity, setactivity] = useState(null);
    const [gameconfigs, setGameconfigs] = useState([{ showText: true }, { showText: true }]);
    const [currentQuestionIndex, setcurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setloading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);

    // Summary data
    const [responseLogs, setResponseLogs] = useState([]);
    const [startDate, setStartDate] = useState(null);

    useEffect(() => {
        setloading(true);

        if (!currentGameData) {
            setError("No hay datos de la actividad. Regresa al panel para iniciar.");
            setloading(false);
            return;
        }

        // Read gameConfigs (API returns camelCase with capital C)
        const rawConfigs = currentGameData.gameConfigs || currentGameData.gameconfigs;
        if (rawConfigs && rawConfigs.length >= 1) {
            const sorted = [...rawConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            // Ensure showText defaults to true if not explicitly set
            setGameconfigs(sorted.map(c => ({ showText: true, ...c })));
        }

        const mappedActivity = {
            name: "Centro de quiz",
            recommendedXP: 100,
            questions: (currentGameData.questions || []).map((q, i) => ({
                id: q.id,
                question: q.question,
                word: q.word || null,
                options: (q.responseList || []).map((r, ri) => ({
                    id: r.id,
                    text: r.answerText,
                    isCorrect: r.isCorrect,
                    word: r.word || null
                }))
            }))
        };

        if (mappedActivity.questions.length === 0) {
            setError("La actividad no tiene preguntas configuradas.");
            setloading(false);
            return;
        }

        setactivity(mappedActivity);
        setStartDate(new Date().toISOString());
        setError(null);
        setloading(false);
    }, [currentGameData]);

    const currentQuestion = activity?.questions?.[currentQuestionIndex];
    const config1 = gameconfigs[0] || {};
    const config2 = gameconfigs[1] || {};

    // Helper: get display text
    const getWordText = (word, config) => {
        if (!word) return null;
        return config.isMazahua ? word.mazahuaWord : word.spanishWord;
    };

    const handleAnswerSelect = (optionId) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(optionId);

        const isCorrect = currentQuestion.options.find(o => o.id === optionId)?.isCorrect || false;
        setAnswers(prev => [...prev, { questionId: currentQuestion.id, optionId, isCorrect }]);

        const selectedOptionObj = currentQuestion.options.find(o => o.id === optionId);
        const correctOptionObj = currentQuestion.options.find(o => o.isCorrect);

        const logEntry = {
            questionId: currentQuestion.id,
            answerId: optionId,
            isCorrect: isCorrect,
            questionText: currentQuestion.question || getWordText(currentQuestion.word, config1),
            questionImage: config1.showImage && currentQuestion.word ? currentQuestion.word.imageUrl : null,
            questionAudio: config1.playAudio && currentQuestion.word ? currentQuestion.word.audioUrl : null,
            selectedText: selectedOptionObj ? (selectedOptionObj.text || getWordText(selectedOptionObj.word, config2)) : null,
            selectedImage: selectedOptionObj && config2.showImage && selectedOptionObj.word ? selectedOptionObj.word.imageUrl : null,
            selectedAudio: selectedOptionObj && config2.playAudio && selectedOptionObj.word ? selectedOptionObj.word.audioUrl : null,
            correctText: correctOptionObj ? (correctOptionObj.text || getWordText(correctOptionObj.word, config2)) : null,
            correctImage: correctOptionObj && config2.showImage && correctOptionObj.word ? correctOptionObj.word.imageUrl : null,
            correctAudio: correctOptionObj && config2.playAudio && correctOptionObj.word ? correctOptionObj.word.audioUrl : null,
        };

        setResponseLogs(prev => [...prev, logEntry]);

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setFeedback({
            type: isCorrect ? 'correct' : 'incorrect',
            title: isCorrect ? '¡Correcto!' : '¡Incorrecto!'
        });
    };

    const handleNextquestion = () => {
        if (currentQuestionIndex < activity.questions.length - 1) {
            setcurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            setShowResult(true);
        }
    };

    const handleRestart = () => {
        setcurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswers([]);
        setScore(0);
        setShowResult(false);
        setResponseLogs([]);
        setStartDate(new Date().toISOString());
    };

    const handleExit = () => {
        if (returnToMap) {
            navigate('/estudiante/mapa');
        } else {
            navigate('/games/quiz');
        }
    };

    if (loading) {
        return (
            <div className="quiz-access-panel" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <img src={IconHourglass} alt="Cargando" className="w-16 h-16 mx-auto mb-4" />
                <p>Cargando quiz...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-access-panel" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <img src={IconQuiz} alt="Quiz Error" className="w-16 h-16 mx-auto mb-4 drop-shadow-sm opacity-50 grayscale" />
                <h2>{error}</h2>
                <button
                    className="btn-play-quiz"
                    onClick={handleExit}
                    style={{ maxWidth: '200px', margin: '1rem auto' }}
                >
                    Volver
                </button>
            </div>
        );
    }

    if (showResult) {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');

        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 3}
                startDate={startDate}
                correctAnswers={score}
                totalQuestions={activity.questions.length}
                responseLogs={responseLogs}
                onExit={handleExit}
                onRetry={handleRestart}
            />
        );
    }

    return (
        <div className="quiz-access-panel">
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button onClick={handleExit} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>←</button>
                    <span style={{ fontWeight: '600', color: '#5b21b6' }}>{activity.name}</span>
                    <span style={{ color: '#6b7280' }}>{`${currentQuestionIndex + 1}/${activity.questions.length}`}</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', marginBottom: '2rem' }}>
                    <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                        borderRadius: '3px',
                        width: `${((currentQuestionIndex + 1) / activity.questions.length) * 100}%`,
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                {/* question Card */}
                <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                    {/* question stimulus — config1 (GameCard con imagen y/o audio) */}
                    {currentQuestion.word &&
                        ((config1.showImage && currentQuestion.word.imageUrl) ||
                            (config1.playAudio && currentQuestion.word.audioUrl)) && (
                            <div className="quiz-question-card">
                                <GameCard
                                    imageUrl={config1.showImage ? currentQuestion.word.imageUrl : undefined}
                                    audioUrl={config1.playAudio ? currentQuestion.word.audioUrl : undefined}
                                    disabled={false}
                                />
                            </div>
                        )}

                    {config1.showText && (
                        <h2 style={{ textAlign: 'center', color: '#1f2937', fontSize: '20px', marginBottom: '2rem' }}>
                            {currentQuestion.question || getWordText(currentQuestion.word, config1)}
                        </h2>
                    )}

                    {/* options — config2 (GameCard por opción, como en Intruso) */}
                    <div className="quiz-options-grid">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedAnswer === option.id;
                            const showCorrect = selectedAnswer !== null && option.isCorrect;
                            const showWrong = isSelected && !option.isCorrect;

                            const optionText = config2.showText
                                ? (option.text || getWordText(option.word, config2) || '')
                                : '';

                            // Omitir opciones totalmente vacías (sin texto, imagen ni audio)
                            const hasContent = optionText || (config2.showImage && option.word?.imageUrl) || (config2.playAudio && option.word?.audioUrl);
                            if (!hasContent) return null;

                            return (
                                <GameCard
                                    key={option.id}
                                    text={optionText || undefined}
                                    imageUrl={config2.showImage ? option.word?.imageUrl : undefined}
                                    audioUrl={config2.playAudio ? option.word?.audioUrl : undefined}
                                    onClick={() => handleAnswerSelect(option.id)}
                                    selected={showCorrect ? 'correct' : showWrong ? 'incorrect' : null}
                                    disabled={selectedAnswer !== null}
                                    animationDelay={`${index * 0.08}s`}
                                />
                            );
                        })}
                    </div>

                    {/* Next button */}
                    {selectedAnswer !== null && (
                        <button
                            onClick={handleNextquestion}
                            className="btn-play-quiz"
                            style={{ marginTop: '1.5rem', width: '100%' }}
                        >
                            {currentQuestionIndex < activity.questions.length - 1 ? 'Siguiente →' : 'Ver Resultados'}
                        </button>
                    )}
                </div>
            </div>

            <GameAlert
                isOpen={!!feedback}
                type={feedback?.type}
                autoCloseDuration={1500}
                onClose={() => setFeedback(null)}
            />
        </div>
    );
}

export default QuizGameView;
