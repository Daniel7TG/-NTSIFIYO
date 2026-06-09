import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import IconHourglass from '../../../assets/svgs/loading_hourglass.svg';
import GameSummary from '../GamePanel/GameSummary';
import GameAlert from '../GamePanel/GameAlert';
import GameCard from '../GameCard/GameCard';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/fillBlank/FillBlank.css';

const FillBlankGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    const [activity, setActivity] = useState(null);
    const [gameConfigs, setGameConfigs] = useState([{ showText: true }, { showText: true }]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [responseLogs, setResponseLogs] = useState([]);
    const [startDate, setStartDate] = useState(null);

    useEffect(() => {
        setLoading(true);

        if (!currentGameData) {
            setError("No hay datos de la actividad. Regresa al panel para iniciar.");
            setLoading(false);
            return;
        }

        const rawConfigs = currentGameData.gameConfigs || currentGameData.gameconfigs;
        if (rawConfigs && rawConfigs.length >= 1) {
            const sorted = [...rawConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setGameConfigs(sorted.map(c => ({ showText: true, ...c })));
        }

        const mappedActivity = {
            name: "Completar Oración",
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
            setLoading(false);
            return;
        }

        setActivity(mappedActivity);
        setStartDate(new Date().toISOString());
        setError(null);
        setLoading(false);
    }, [currentGameData]);

    const currentQuestion = activity?.questions?.[currentQuestionIndex];
    const config2 = gameConfigs[1] || {};

    const getWordText = (word, config) => {
        if (!word) return null;
        return config.isMazahua ? word.mazahuaWord : word.spanishWord;
    };

    const renderQuestionWithBlank = (questionText, selectedOptionText) => {
        if (!questionText) return null;
        
        const parts = questionText.split('___');
        const result = [];
        
        parts.forEach((part, index) => {
            result.push(<span key={`text-${index}`}>{part}</span>);
            if (index < parts.length - 1) {
                result.push(
                    <span 
                        key={`blank-${index}`} 
                        className={`fb-blank ${selectedOptionText ? 'fb-blank--filled' : ''}`}
                    >
                        {selectedOptionText || '___'}
                    </span>
                );
            }
        });
        
        return result;
    };

    const handleAnswerSelect = (optionId, optionText) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(optionId);

        const isCorrect = currentQuestion.options.find(o => o.id === optionId)?.isCorrect || false;

        const selectedOptionObj = currentQuestion.options.find(o => o.id === optionId);
        const correctOptionObj = currentQuestion.options.find(o => o.isCorrect);

        const logEntry = {
            questionId: currentQuestion.id,
            answerId: optionId,
            isCorrect: isCorrect,
            questionText: currentQuestion.question,
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

    const handleNextQuestion = () => {
        if (currentQuestionIndex < activity.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            setShowResult(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        setShowResult(false);
        setResponseLogs([]);
        setStartDate(new Date().toISOString());
    };

    const handleExit = () => {
        if (returnToMap) {
            navigate('/estudiante/mapa');
        } else {
            navigate('/games/fill_blank');
        }
    };

    if (loading) {
        return (
            <div className="fb-loading">
                <img src={IconHourglass} alt="Cargando" className="fb-loading-icon" />
                <p>Cargando actividad...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fb-error">
                <span className="material-symbols-outlined fb-error-icon">error</span>
                <h2>{error}</h2>
                <button className="fb-btn" onClick={handleExit}>Volver</button>
            </div>
        );
    }

    if (showResult) {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');

        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 10}
                startDate={startDate}
                correctAnswers={score}
                totalQuestions={activity.questions.length}
                responseLogs={responseLogs}
                onExit={handleExit}
                onRetry={handleRestart}
            />
        );
    }

    const selectedOption = currentQuestion.options.find(o => o.id === selectedAnswer);
    const selectedText = selectedOption ? (selectedOption.text || getWordText(selectedOption.word, config2)) : null;
    const correctOption = currentQuestion.options.find(o => o.isCorrect);

    return (
        <div className="fb-container">
            <div className="fb-wrapper">
                <div className="fb-header">
                    <button onClick={handleExit} className="fb-back-btn">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <span className="fb-title">{activity.name}</span>
                    <span className="fb-counter">{currentQuestionIndex + 1}/{activity.questions.length}</span>
                </div>

                <div className="fb-progress">
                    <div 
                        className="fb-progress-fill"
                        style={{ width: `${((currentQuestionIndex + 1) / activity.questions.length) * 100}%` }}
                    />
                </div>

                <div className="fb-card">
                    <div className="fb-question-section">
                        <h2 className="fb-question-text">
                            {renderQuestionWithBlank(currentQuestion.question, selectedText)}
                        </h2>
                    </div>

                    <div className="fb-options-grid">
                        {currentQuestion.options.map((option, index) => {
                            const optionText = config2.showText
                                ? (option.text || getWordText(option.word, config2) || '')
                                : '';
                            const optionImageUrl = config2.showImage && option.word ? option.word.imageUrl : null;
                            const optionAudioUrl = config2.playAudio && option.word ? option.word.audioUrl : null;

                            const hasContent = optionText || optionImageUrl || optionAudioUrl;
                            if (!hasContent) return null;

                            let selected = null;
                            if (selectedAnswer !== null) {
                                if (option.id === selectedAnswer) {
                                    selected = option.isCorrect ? 'correct' : 'incorrect';
                                } else if (option.isCorrect) {
                                    selected = 'correct';
                                }
                            }

                            return (
                                <GameCard
                                    key={option.id}
                                    text={optionText}
                                    imageUrl={optionImageUrl}
                                    audioUrl={optionAudioUrl}
                                    onClick={() => handleAnswerSelect(option.id, optionText)}
                                    selected={selected}
                                    disabled={selectedAnswer !== null}
                                    animationDelay={`${index * 0.1}s`}
                                />
                            );
                        })}
                    </div>

                    {selectedAnswer !== null && (
                        <button className="fb-btn fb-btn-next" onClick={handleNextQuestion}>
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
};

export default FillBlankGameView;
