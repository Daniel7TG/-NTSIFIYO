import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import GameService from '../../../services/GameService';
import GameSummary from '../GamePanel/GameSummary';
import GameCard from '../GameCard/GameCard';
import GameAlert from '../GamePanel/GameAlert';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/pares/Pares.css';

const buildCards = (words, config, prefix) => {
    return words.map(word => ({
        uid: `${prefix}-${word.id}`,
        wordId: word.id,
        side: prefix,
        text: config.showText ? (config.isMazahua ? word.mazahuaWord : word.spanishWord) : null,
        imageUrl: config.showImage ? word.imageUrl : null,
        audioUrl: config.playAudio ? word.audioUrl : null,
    })).sort(() => Math.random() - 0.5);
};

const ParesGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    const [loading, setLoading] = useState(true);
    const [activityXP, setActivityXP] = useState(100);

    const [leftCards, setLeftCards] = useState([]);
    const [rightCards, setRightCards] = useState([]);
    const [gameWords, setGameWords] = useState([]);

    const [matchedPairs, setMatchedPairs] = useState([]);
    const [matchedLines, setMatchedLines] = useState([]); // stores coordinate lines for matched pairs
    
    // Drag state
    const [dragState, setDragState] = useState(null);
    const [errorFeedback, setErrorFeedback] = useState(false);

    const [gameState, setGameState] = useState('loading'); // loading | playing | finished | error
    const [elapsed, setElapsed] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'correct' });
    const [responseLogs, setResponseLogs] = useState([]);

    const timerRef = useRef(null);
    const startDateRef = useRef(null);
    const containerRef = useRef(null);
    const cardRefs = useRef({}); // store DOM nodes of cards to compute centers

    const initGame = async () => {
        setLoading(true);
        
        let data = currentGameData;
        if (!data || !data.words) {
            const result = await GameService.startGame(parseInt(activityId, 10));
            if (result.success && result.data) {
                data = result.data;
            } else {
                setGameState('error');
                setLoading(false);
                return;
            }
        }

        const configs = data.gameConfigs || [];
        const cfg0 = configs[0] || { showText: true, showImage: false, playAudio: false, isMazahua: true };
        const cfg1 = configs[1] || { showText: true, showImage: false, playAudio: false, isMazahua: false };

        setLeftCards(buildCards(data.words, cfg0, 'L'));
        setRightCards(buildCards(data.words, cfg1, 'R'));
        setGameWords(data.words);
        setActivityXP(data.experience || 100);

        setMatchedPairs([]);
        setMatchedLines([]);
        setAttempts(0);
        setElapsed(0);
        setResponseLogs([]);
        setGameState('playing');
        startDateRef.current = new Date().toISOString();
        setLoading(false);
    };

    useEffect(() => {
        initGame();
    }, [currentGameData]);

    // Timer
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // Get center coordinates of a card relative to the container
    const getCardCenter = (uid) => {
        const node = cardRefs.current[uid];
        const container = containerRef.current;
        if (!node || !container) return { x: 0, y: 0 };

        const nodeRect = node.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        return {
            x: (nodeRect.left - containerRect.left) + nodeRect.width / 2,
            y: (nodeRect.top - containerRect.top) + nodeRect.height / 2
        };
    };

    // Update lines when window is resized to keep them attached
    useEffect(() => {
        const handleResize = () => {
            if (matchedPairs.length > 0) {
                const newLines = matchedPairs.map(pair => {
                    const start = getCardCenter(pair.startUid);
                    const end = getCardCenter(pair.endUid);
                    return { ...pair, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
                });
                setMatchedLines(newLines);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [matchedPairs]);

    const showAlert = (type) => {
        setAlertConfig({ isOpen: true, type });
    };

    const handleAlertClose = () => {
        setAlertConfig({ isOpen: false, type: 'correct' });
    };

    // ─── Drag Handlers ────────────────────────────────────────────────────────

    const handlePointerDown = (e, card) => {
        if (gameState !== 'playing') return;
        if (matchedPairs.some(p => p.wordId === card.wordId)) return; // already matched
        
        // Prevent browser defaults like scrolling or text selection
        if (e.cancelable) e.preventDefault();

        // Play audio if available
        if (card.audioUrl) {
            new Audio(card.audioUrl).play().catch(err => console.error('Audio play error:', err));
        }

        const center = getCardCenter(card.uid);
        
        setDragState({
            startUid: card.uid,
            startWordId: card.wordId,
            startSide: card.side,
            startX: center.x,
            startY: center.y,
            currentX: center.x,
            currentY: center.y,
        });

        if (containerRef.current) {
            containerRef.current.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e) => {
        if (!dragState || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        setDragState(prev => ({
            ...prev,
            currentX: e.clientX - rect.left,
            currentY: e.clientY - rect.top
        }));
    };

    const finishGame = (finalPairs) => {
        clearInterval(timerRef.current);
        const words = gameWords || [];
        
        const logs = words.map(w => {
            const isMatched = finalPairs.some(p => p.wordId === w.id);
            return {
                questionId: null,
                answerId: w.id,
                isCorrect: isMatched,
                wordText: w.spanishWord || w.mazahuaWord
            };
        });
        
        setResponseLogs(logs);
        setGameState('finished');
    };

    const handlePointerUp = (e) => {
        if (!dragState) return;

        if (containerRef.current) {
            containerRef.current.releasePointerCapture(e.pointerId);
        }

        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        const cardTarget = elementBelow?.closest('[data-uid]');
        
        if (cardTarget) {
            const targetUid = cardTarget.getAttribute('data-uid');
            const targetWordId = parseInt(cardTarget.getAttribute('data-word-id'), 10);
            const targetSide = cardTarget.getAttribute('data-side');

            if (targetSide !== dragState.startSide) {
                setAttempts(a => a + 1);
                
                if (targetWordId === dragState.startWordId) {
                    const startNode = getCardCenter(dragState.startUid);
                    const endNode = getCardCenter(targetUid);
                    
                    const newPair = { 
                        startUid: dragState.startUid, 
                        endUid: targetUid, 
                        wordId: targetWordId,
                        x1: startNode.x, y1: startNode.y,
                        x2: endNode.x, y2: endNode.y
                    };

                    setMatchedPairs(prev => {
                        const updated = [...prev, newPair];
                        const totalWords = gameWords.length;
                        if (updated.length === totalWords && totalWords > 0) {
                            setTimeout(() => finishGame(updated), 1000);
                        }
                        return updated;
                    });
                    setMatchedLines(prev => [...prev, newPair]);
                    showAlert('correct');
                } else {
                    showAlert('incorrect');
                }
            }
        }
        
        setDragState(null);
    };

    // ─── Render ─────────────────────────────────────────────────────────────

    if (loading || gameState === 'loading') {
        return (
            <div className="game-loading-container">
                <div className="spinner" />
                <p>Cargando juego de Pares...</p>
            </div>
        );
    }

    if (gameState === 'error') {
        return (
            <div className="game-error-container">
                <div className="game-top-bar">
                    <button className="game-top-bar__back-btn" onClick={() => navigate(-1)}>‹</button>
                    <span className="game-top-bar__title">Error</span>
                </div>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    No se encontraron palabras para este juego.
                </div>
            </div>
        );
    }

    if (gameState === 'finished') {
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdParam = urlParams.get('gameId');
        const totalWords = gameWords.length;

        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 9}
                startDate={startDateRef.current || new Date().toISOString()}
                correctAnswers={matchedPairs.length}
                totalQuestions={totalWords}
                responseLogs={responseLogs}
                onExit={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/pares')}
                onRetry={initGame}
            />
        );
    }

    const progressPercent = (gameWords.length > 0)
        ? (matchedPairs.length / gameWords.length) * 100 : 0;

    return (
        <div className="game-container">
            {/* Header */}
            <div className="game-top-bar">
                <button 
                    className="game-top-bar__back-btn" 
                    onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/pares')}
                >‹</button>
                <span className="game-top-bar__title">Enlazar Elementos</span>
                <div className="game-top-bar__timer">⏱ {formatTime(elapsed)}</div>
            </div>

            {/* Progress */}
            <div className="game-progress-row">
                <div className="game-progress-bar-bg">
                    <div className="game-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="game-progress-label">
                    {matchedPairs.length}/{gameWords.length}
                </span>
            </div>

            {/* Game Board */}
            <div className="pares-board-scroller">
                <div 
                    className="pares-container" 
                    ref={containerRef}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {/* SVG Layer for Drawing Lines */}
                    <svg className="pares-svg-overlay">
                        {/* Completed matched lines */}
                        {matchedLines.map((line, idx) => (
                            <line 
                                key={idx} 
                                x1={line.x1} y1={line.y1} 
                                x2={line.x2} y2={line.y2} 
                                className="pares-line-matched" 
                            />
                        ))}
                        
                        {/* Currently dragging line */}
                        {dragState && (
                            <line 
                                x1={dragState.startX} y1={dragState.startY} 
                                x2={dragState.currentX} y2={dragState.currentY} 
                                className="pares-line-dragging" 
                            />
                        )}
                    </svg>

                    {/* Left Column */}
                    <div className="pares-column">
                        {leftCards.map((card, index) => {
                            const isMatched = matchedPairs.some(p => p.startUid === card.uid || p.endUid === card.uid);
                            return (
                                <div 
                                    key={card.uid}
                                    data-uid={card.uid}
                                    data-word-id={card.wordId}
                                    data-side={card.side}
                                    ref={el => cardRefs.current[card.uid] = el}
                                    className={`pares-card-wrapper ${isMatched ? 'matched' : ''}`}
                                    onPointerDown={(e) => !isMatched && handlePointerDown(e, card)}
                                >
                                    <GameCard 
                                        text={card.text}
                                        imageUrl={card.imageUrl}
                                        audioUrl={card.audioUrl}
                                        disabled={isMatched}
                                        animationDelay={`${index * 0.1}s`}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column */}
                    <div className="pares-column">
                        {rightCards.map((card, index) => {
                            const isMatched = matchedPairs.some(p => p.startUid === card.uid || p.endUid === card.uid);
                            return (
                                <div 
                                    key={card.uid}
                                    data-uid={card.uid}
                                    data-word-id={card.wordId}
                                    data-side={card.side}
                                    ref={el => cardRefs.current[card.uid] = el}
                                    className={`pares-card-wrapper ${isMatched ? 'matched' : ''}`}
                                    onPointerDown={(e) => !isMatched && handlePointerDown(e, card)}
                                >
                                    <GameCard 
                                        text={card.text}
                                        imageUrl={card.imageUrl}
                                        audioUrl={card.audioUrl}
                                        disabled={isMatched}
                                        animationDelay={`${index * 0.1}s`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <GameAlert
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                onClose={handleAlertClose}
                autoCloseDuration={1000}
            />
        </div>
    );
};

export default ParesGameView;
