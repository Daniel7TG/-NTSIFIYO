// GameSummary.jsx - Rediseño v2
import React, { useState, useEffect, useMemo } from 'react';
import ActivityApiService from '../../../services/ActivityApiService';
import '../../../styles/components/games/gamePanel/GameSummary.css';
import { useGame } from '../../../context/GameContext';
import { PAIR_TYPES } from '../../../config/activityConfig';
import ProgressRing from '../../common/ProgressRing';

import IconCelebration from '../../../assets/svgs/celebration.svg';
import IconMotivation from '../../../assets/svgs/motivation.svg';
import IconSuccess from '../../../assets/svgs/success_game.svg';
import IconError from '../../../assets/svgs/error_cross.svg';

const PERFECT_THRESHOLD = 100;
const EXCELENTE_THRESHOLD = 80;
const BUENO_THRESHOLD = 60;

const getPerformance = (percentage) => {
    if (percentage === PERFECT_THRESHOLD) return 'perfecto';
    if (percentage >= EXCELENTE_THRESHOLD) return 'excelente';
    if (percentage >= BUENO_THRESHOLD) return 'bueno';
    return 'necesita-mejorar';
};

const getHeaderContent = (percentage) => {
    const perf = getPerformance(percentage);
    const messages = {
        perfecto: { icon: <img src={IconCelebration} alt="Perfecto" className="gs-header-icon-svg inline" />, title: '¡PERFECTO!', sub: '¡No fallaste ni una!' },
        excelente: { icon: '⭐', title: '¡Increíble!', sub: '¡Muy buen trabajo!' },
        bueno: { icon: '✓', title: '¡Bien hecho!', sub: '¡Sigue así!' },
        'necesita-mejorar': { icon: <img src={IconMotivation} alt="Necesita Mejorar" className="gs-header-icon-svg inline" />, title: '¡Sigue practicando!', sub: '¡Tú puedes!' }
    };
    return messages[perf];
};

const Confetti = () => (
    <div className="gs-confetti-container" aria-hidden="true">
        {[...Array(12)].map((_, i) => <div key={i} className="confetti-piece"></div>)}
    </div>
);

const GameSummary = ({
    activityId,
    gameId,
    startDate,
    correctAnswers,
    totalQuestions,
    responseLogs,
    onExit,
    onRetry
}) => {
    const { currentGameData } = useGame();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [expandedLogs, setExpandedLogs] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // Game type detection using activityConfig.
    // Fallback: if the start payload didn't carry gameType, treat logs that
    // carry wordText (and no questionId) as a pairs-style word summary.
    const gameType = currentGameData?.gameType;
    const looksLikeWordSummary = (responseLogs || []).some(l => l.wordText && l.questionId == null);
    const isPairsGame = PAIR_TYPES.includes(gameType) || looksLikeWordSummary;

    // Performance tier
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const performance = getPerformance(percentage);
    const headerContent = getHeaderContent(percentage);
    const starsCount = Math.round((percentage / 100) * 5);

    useEffect(() => {
        if (startDate) {
            const start = new Date(startDate);
            const end = new Date();
            const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
            setTimeElapsed(diffInSeconds > 0 ? diffInSeconds : 0);
        }
    }, [startDate]);

    const calculateResults = async () => {
        setLoading(true);
        setError(null);
        try {
            const trueActivityId = currentGameData?.activityId ? parseInt(currentGameData.activityId, 10) : parseInt(activityId, 10);
            const trueGameId = currentGameData?.activityId ? parseInt(activityId, 10) : parseInt(gameId, 10);

            const payload = {
                activityId: trueActivityId,
                startDate: startDate,
                correctAnswers: correctAnswers,
                gameId: trueGameId,
                responseLogs: (responseLogs || []).map(log => ({
                    questionId: log.questionId,
                    responseAnswerId: log.answerId,
                    isCorrect: log.isCorrect
                }))
            };

            const apiResult = await ActivityApiService.completeActivity(payload);

            if (apiResult.success && apiResult.data) {
                setResult(apiResult.data);
            } else if (apiResult.success) {
                // Si tuvo éxito pero no hay datos (fallback visual mínimo)
                setResult({ xpGained: 0, actualXp: 0, currentLevel: 1, isLevelUp: false });
            } else {
                setError(apiResult.error || "No se pudo guardar el progreso.");
            }
        } catch (err) {
            console.error("Error completing activity:", err);
            setError("Error de conexión al guardar tu progreso.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateResults();
    }, [activityId, gameId, startDate, correctAnswers, responseLogs]);

    const playAudio = (audioUrl) => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(() => { });
        }
    };

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const pairsSummary = useMemo(() => {
        if (!isPairsGame || !responseLogs || responseLogs.length === 0) return null;
        const wordsMap = new Map();
        responseLogs.forEach(log => {
            if (!wordsMap.has(log.answerId)) {
                wordsMap.set(log.answerId, { text: log.wordText, isCorrect: log.isCorrect });
            } else {
                if (log.isCorrect) wordsMap.get(log.answerId).isCorrect = true;
            }
        });
        const completed = [];
        const incomplete = [];
        wordsMap.forEach(val => {
            if (val.isCorrect) completed.push(val.text);
            else incomplete.push(val.text);
        });
        return { completed, incomplete };
    }, [responseLogs, isPairsGame]);

    const ringClass = percentage < 40 ? 'low' : percentage < 70 ? 'medium' : percentage < 100 ? 'high' : 'perfect';

    if (loading) {
        return (
            <div className="game-summary-container">
                <div className="gs-loading-card">
                    <div className="spinner"></div>
                    <h2 className="gs-loading-title">Guardando progreso...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="game-summary-container">
            <div className="gs-card">
                {/* Dynamic Header */}
                <div className={`gs-header gs-header-centered ${performance}`}>
                    {performance === 'perfecto' && <Confetti />}
                    <span className="gs-header-icon">{headerContent.icon}</span>
                    <h2>{headerContent.title}</h2>
                    <p>{headerContent.sub}</p>
                </div>

                {/* Content Row */}
                <div className="gs-content-row">
                    {/* Left Panel */}
                    <div className="gs-left-panel">
                        {/* Score Ring — uses unified ProgressRing with tier colors */}
                        <div className="gs-score-section">
                            <div className="gs-score-circle">
                                <ProgressRing
                                    value={correctAnswers}
                                    max={totalQuestions}
                                    size={160}
                                    strokeWidth={12}
                                    showTier
                                    centerLabel={
                                        <div className="gs-score-text">
                                            <span className="gs-score-number">{correctAnswers}</span>
                                            <span className="gs-score-total">/ {totalQuestions}</span>
                                        </div>
                                    }
                                />
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="gs-metrics-section">
                            <div className="gs-metric" title={`${percentage}% de precisión`}>
                                <span className="gs-metric-label">Precisión</span>
                                <div className="gs-metric-stars">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`gs-star ${i < starsCount ? 'filled' : 'empty'}`}>★</span>
                                    ))}
                                </div>
                            </div>
                            <div className="gs-metric">
                                <span className="gs-metric-label">Tiempo</span>
                                <span className="gs-metric-value">⏱ {formatTime(timeElapsed)}</span>
                            </div>
                        </div>

                        {/* XP Badge or Error Message */}
                        {result && !error && (
                            <div className={`gs-xp-container ${result.isLevelUp ? 'level-up-anim' : ''}`}>
                                <div className="gs-xp-badge">
                                    <span className="gs-xp-icon">⭐</span>
                                    <span className="gs-xp-value">+{result.xpGained} XP</span>
                                </div>
                                <div className="gs-level-info">
                                    {result.isLevelUp && <div className="gs-level-up-tag">¡SUBISTE DE NIVEL!</div>}
                                    <span className="gs-current-level">Nivel {result.currentLevel}</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="gs-error-container-inline">
                                <div className="gs-error-icon">⚠️</div>
                                <p className="gs-error-msg">{error}</p>
                                <button className="gs-btn-retry-api" onClick={calculateResults}>
                                    🔄 Reintentar guardar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel */}
                    <div className="gs-right-panel">
                        <div className={`gs-logs-section ${expandedLogs ? 'expanded' : ''}`}>
                            <button
                                className="gs-logs-toggle"
                                onClick={() => setExpandedLogs(!expandedLogs)}
                            >
                                <span>{isPairsGame ? 'Ver palabras' : 'Revisar respuestas'}</span>
                                <span className="gs-toggle-arrow">{expandedLogs ? '▲' : '▼'}</span>
                            </button>

                            <div className="gs-logs-list">
                                {isPairsGame && pairsSummary ? (
                                    <div className="gs-pairs-summary">
                                        <div className="gs-pairs-completed">
                                            <h4 className="gs-pairs-title">
                                                <img src={IconSuccess} alt="Check" className="inline w-4 h-4 mr-1" /> Completadas
                                            </h4>
                                            <ul className="gs-pairs-list">
                                                {pairsSummary.completed.length > 0 ? (
                                                    pairsSummary.completed.map((word, i) => <li key={i}>{word}</li>)
                                                ) : (
                                                    <li className="gs-pairs-empty">Ninguna aún</li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="gs-pairs-incomplete">
                                            <h4 className="gs-pairs-title">
                                                <img src={IconError} alt="Cross" className="inline w-4 h-4 mr-1" /> Incompletas
                                            </h4>
                                            <ul className="gs-pairs-list">
                                                {pairsSummary.incomplete.length > 0 ? (
                                                    pairsSummary.incomplete.map((word, i) => <li key={i}>{word}</li>)
                                                ) : (
                                                    <li className="gs-pairs-empty">¡Todas completadas!</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    (responseLogs || []).map((log, index) => (
                                        <div key={index} className={`gs-log-item ${log.isCorrect ? 'log-correct' : 'log-wrong'}`}>
                                            <div className="gs-log-header">
                                                <span className="gs-log-icon">
                                                    {log.isCorrect ? <img src={IconSuccess} alt="Correcto" className="w-4 h-4" /> : <img src={IconError} alt="Incorrecto" className="w-4 h-4" />}
                                                </span>
                                                <span className="gs-log-question-num">Pregunta {index + 1}</span>
                                            </div>

                                            <div className="gs-log-content">
                                                <div className="gs-log-label">Pregunta:</div>
                                                <div className="gs-log-stimulus">
                                                    {log.questionImage && <img src={log.questionImage} alt="Q" className="gs-log-img" />}
                                                    {log.questionText && <span>{log.questionText}</span>}
                                                    {log.questionAudio && (
                                                        <button onClick={() => playAudio(log.questionAudio)} className="gs-log-audio-btn">🔊</button>
                                                    )}
                                                </div>
                                            </div>

                                            {log.isMemorama ? (
                                                <div className="gs-log-comparison">
                                                    <div className="gs-log-cell correct-cell">
                                                        <div className="gs-log-label">Respuesta correcta (Estímulo):</div>
                                                        <div className="gs-log-value">
                                                            {log.questionText && <span>{log.questionText}</span>}
                                                            {log.questionAudio && <button onClick={() => playAudio(log.questionAudio)} className="gs-log-audio-btn">🔊</button>}
                                                        </div>
                                                        <div className="gs-log-label">Tarjeta mostrada (a evaluar):</div>
                                                        <div className="gs-log-value">
                                                            {log.correctText && <span>{log.correctText}</span>}
                                                            {log.correctAudio && <button onClick={() => playAudio(log.correctAudio)} className="gs-log-audio-btn">🔊</button>}
                                                        </div>
                                                    </div>
                                                    <div className="gs-log-cell user-cell">
                                                        <div className="gs-log-label">Tu elección:</div>
                                                        <div className="gs-log-value" style={{ fontWeight: 'bold', color: log.isCorrect ? '#16a34a' : '#dc2626' }}>
                                                            {log.userSaidMatch ? 'Verdadero (Match)' : 'Falso (No Match)'}
                                                        </div>
                                                        {!log.isCorrect && (
                                                            <div className="gs-log-correction">Era {log.actuallyMatched ? 'Match' : 'No Match'}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="gs-log-comparison">
                                                    <div className="gs-log-cell correct-cell">
                                                        <div className="gs-log-label">Correcta:</div>
                                                        <div className="gs-log-value">
                                                            {log.correctImage && <img src={log.correctImage} alt="C" className="gs-log-img" />}
                                                            {log.correctText && <span>{log.correctText}</span>}
                                                            {log.correctAudio && <button onClick={() => playAudio(log.correctAudio)} className="gs-log-audio-btn">🔊</button>}
                                                        </div>
                                                    </div>
                                                    {!log.isCorrect && (
                                                        <div className="gs-log-cell wrong-cell">
                                                            <div className="gs-log-label">Seleccionaste:</div>
                                                            <div className="gs-log-value">
                                                                {log.selectedImage && <img src={log.selectedImage} alt="W" className="gs-log-img" />}
                                                                {log.selectedText ? <span>{log.selectedText}</span> : (!log.selectedImage && !log.selectedAudio ? <span>(Sin respuesta / Tiempo)</span> : null)}
                                                                {log.selectedAudio && <button onClick={() => playAudio(log.selectedAudio)} className="gs-log-audio-btn">🔊</button>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="gs-actions">
                    {onRetry && (
                        <button className="gs-btn gs-btn-retry" onClick={onRetry}>🔄 Reintentar</button>
                    )}
                    <button className="gs-btn gs-btn-exit" onClick={onExit}>✓ Continuar</button>
                </div>
            </div>
        </div>
    );
};

export default GameSummary;