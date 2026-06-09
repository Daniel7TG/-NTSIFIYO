import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import GameService from '../../../services/GameService';
import GameSummary from '../GamePanel/GameSummary';
import GameCard from '../GameCard/GameCard';
import GameAlert from '../GamePanel/GameAlert';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/tripas/Tripas.css';

// ─── Difficulty → time budget (seconds) ──────────────────────────────────────
const TIME_BY_DIFFICULTY = { EASY: 150, MEDIUM: 100, HARD: 60 };

const buildSideCards = (words, config, prefix) =>
    words.map(word => ({
        uid: `${prefix}-${word.id}`,
        wordId: word.id,
        side: prefix,
        text: config.showText ? (config.isMazahua ? word.mazahuaWord : word.spanishWord) : null,
        imageUrl: config.showImage ? word.imageUrl : null,
        audioUrl: config.playAudio ? word.audioUrl : null,
    }));

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Geometry: do segments AB and CD cross? ──────────────────────────────────
const orient = (a, b, c) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));

const segmentsIntersect = (p1, p2, p3, p4) => {
    const o1 = orient(p1, p2, p3);
    const o2 = orient(p1, p2, p4);
    const o3 = orient(p3, p4, p1);
    const o4 = orient(p3, p4, p2);
    return o1 !== o2 && o3 !== o4;
};

const MIN_POINT_DIST = 0.012;   // min normalized gap between captured points
const ORIGIN_GRACE = 0.06;      // ignore collisions this close to the line start

const TripasGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    const [loading, setLoading] = useState(true);
    const [leftCards, setLeftCards] = useState([]);
    const [rightCards, setRightCards] = useState([]);
    const [positions, setPositions] = useState({}); // uid -> {x,y} normalized anchor
    const [gameWords, setGameWords] = useState([]);

    const [matchedPairs, setMatchedPairs] = useState([]);   // {wordId, startUid, endUid}
    const [matchedLines, setMatchedLines] = useState([]);   // {wordId, points:[{x,y}...]}
    const [draftPoints, setDraftPoints] = useState(null);   // current freehand polyline

    const [gameState, setGameState] = useState('loading');  // loading|playing|finished|error
    const [timeLeft, setTimeLeft] = useState(100);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'correct' });
    const [responseLogs, setResponseLogs] = useState([]);

    const timerRef = useRef(null);
    const startDateRef = useRef(null);
    const boardRef = useRef(null);
    const dragRef = useRef(null); // {startUid, startWordId, startSide}

    const difficulty = (currentGameData?.difficulty || 'MEDIUM').toUpperCase();

    // ─── Init ────────────────────────────────────────────────────────────────
    const initGame = async () => {
        setLoading(true);

        let data = currentGameData;
        if (!data || !data.words) {
            const result = await GameService.startGame(parseInt(activityId, 10));
            if (result.success && result.data) data = result.data;
            else { setGameState('error'); setLoading(false); return; }
        }

        const configs = data.gameConfigs || [];
        const cfg0 = configs[0] || { showText: false, showImage: true, playAudio: false, isMazahua: true };
        const cfg1 = configs[1] || { showText: true, showImage: false, playAudio: true, isMazahua: true };

        const left = shuffle(buildSideCards(data.words, cfg0, 'L'));
        const right = shuffle(buildSideCards(data.words, cfg1, 'R'));

        // Place each side as a vertical column, shuffled order so pairs cross.
        const layout = {};
        const place = (cards, xPct) => {
            const n = cards.length;
            cards.forEach((c, i) => {
                const y = n === 1 ? 0.5 : 0.12 + (0.76 * i) / (n - 1);
                layout[c.uid] = { x: xPct, y };
            });
        };
        place(left, 0.16);
        place(right, 0.84);

        setLeftCards(left);
        setRightCards(right);
        setPositions(layout);
        setGameWords(data.words);

        setMatchedPairs([]);
        setMatchedLines([]);
        setDraftPoints(null);
        setResponseLogs([]);
        setTimeLeft(TIME_BY_DIFFICULTY[difficulty] ?? TIME_BY_DIFFICULTY.MEDIUM);
        setGameState('playing');
        startDateRef.current = new Date().toISOString();
        setLoading(false);
    };

    useEffect(() => { initGame(); }, [currentGameData]); // eslint-disable-line

    // ─── Countdown ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState !== 'playing') { clearInterval(timerRef.current); return; }
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    finishGame(matchedPairsRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [gameState]); // eslint-disable-line

    // keep latest matched pairs reachable from timer closure
    const matchedPairsRef = useRef([]);
    useEffect(() => { matchedPairsRef.current = matchedPairs; }, [matchedPairs]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const showAlert = (type) => setAlertConfig({ isOpen: true, type });
    const handleAlertClose = () => setAlertConfig({ isOpen: false, type: 'correct' });

    // ─── Coordinate helpers (normalized 0..1 over the board) ───────────────────
    const toNorm = (clientX, clientY) => {
        const r = boardRef.current.getBoundingClientRect();
        return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
    };

    // ─── Drag handlers ─────────────────────────────────────────────────────────
    const handlePointerDown = (e, card) => {
        if (gameState !== 'playing') return;
        if (matchedPairs.some(p => p.wordId === card.wordId)) return;
        if (e.cancelable) e.preventDefault();

        if (card.audioUrl) new Audio(card.audioUrl).play().catch(() => {});

        dragRef.current = { startUid: card.uid, startWordId: card.wordId, startSide: card.side };
        setDraftPoints([{ ...positions[card.uid] }]);
        boardRef.current?.setPointerCapture(e.pointerId);
    };

    const abortDraft = (withError) => {
        dragRef.current = null;
        setDraftPoints(null);
        if (withError) showAlert('incorrect');
    };

    const handlePointerMove = (e) => {
        if (!dragRef.current || !boardRef.current) return;
        const pt = toNorm(e.clientX, e.clientY);

        setDraftPoints(prev => {
            if (!prev) return prev;
            const last = prev[prev.length - 1];
            if (Math.hypot(pt.x - last.x, pt.y - last.y) < MIN_POINT_DIST) return prev;

            const start = prev[0];
            const farFromStart = Math.hypot(pt.x - start.x, pt.y - start.y) > ORIGIN_GRACE;

            // Collision: new segment vs every committed matched line.
            if (farFromStart) {
                for (const line of matchedLines) {
                    const p = line.points;
                    for (let i = 0; i < p.length - 1; i++) {
                        if (segmentsIntersect(last, pt, p[i], p[i + 1])) {
                            setTimeout(() => abortDraft(true), 0); // drop trace + error
                            return prev;
                        }
                    }
                }
            }
            return [...prev, pt];
        });
    };

    const handlePointerUp = (e) => {
        if (!dragRef.current) return;
        boardRef.current?.releasePointerCapture(e.pointerId);

        const drag = dragRef.current;
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-uid]');

        if (target) {
            const targetWordId = parseInt(target.getAttribute('data-word-id'), 10);
            const targetUid = target.getAttribute('data-uid');
            const targetSide = target.getAttribute('data-side');

            if (targetSide !== drag.startSide) {
                if (targetWordId === drag.startWordId) {
                    // snap final point to the target anchor
                    const points = [...(draftPoints || []), { ...positions[targetUid] }];
                    const newPair = { wordId: targetWordId, startUid: drag.startUid, endUid: targetUid };

                    setMatchedLines(prev => [...prev, { wordId: targetWordId, points }]);
                    setMatchedPairs(prev => {
                        const updated = [...prev, newPair];
                        if (updated.length === gameWords.length && gameWords.length > 0) {
                            setTimeout(() => finishGame(updated), 1000);
                        }
                        return updated;
                    });
                    showAlert('correct');
                    dragRef.current = null;
                    setDraftPoints(null);
                    return;
                }
                abortDraft(true); // wrong pair
                return;
            }
        }
        abortDraft(false); // released on empty space — silent drop
    };

    // ─── Finish ──────────────────────────────────────────────────────────────
    const finishGame = (finalPairs) => {
        clearInterval(timerRef.current);
        const logs = (gameWords || []).map(w => ({
            questionId: null,
            answerId: w.id,
            isCorrect: finalPairs.some(p => p.wordId === w.id),
            wordText: w.spanishWord || w.mazahuaWord,
        }));
        setResponseLogs(logs);
        setGameState('finished');
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    if (loading || gameState === 'loading') {
        return (
            <div className="game-loading-container">
                <div className="spinner" />
                <p>Cargando Tripas del Gato...</p>
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
        return (
            <GameSummary
                activityId={activityId}
                gameId={gameIdParam || 13}
                startDate={startDateRef.current || new Date().toISOString()}
                correctAnswers={matchedPairs.length}
                totalQuestions={gameWords.length}
                responseLogs={responseLogs}
                onExit={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/tripas')}
                onRetry={initGame}
            />
        );
    }

    const progressPercent = gameWords.length > 0 ? (matchedPairs.length / gameWords.length) * 100 : 0;
    const lowTime = timeLeft <= 10;

    const renderCard = (card) => {
        const isMatched = matchedPairs.some(p => p.wordId === card.wordId);
        const pos = positions[card.uid];
        return (
            <div
                key={card.uid}
                data-uid={card.uid}
                data-word-id={card.wordId}
                data-side={card.side}
                className={`tripas-card ${isMatched ? 'matched' : ''}`}
                style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                onPointerDown={(e) => !isMatched && handlePointerDown(e, card)}
            >
                <span className="tripas-node" />
                <GameCard
                    text={card.text}
                    imageUrl={card.imageUrl}
                    audioUrl={card.audioUrl}
                    disabled={isMatched}
                />
            </div>
        );
    };

    return (
        <div className="game-container">
            {/* Header */}
            <div className="game-top-bar">
                <button
                    className="game-top-bar__back-btn"
                    onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/tripas')}
                >‹</button>
                <span className="game-top-bar__title">Tripas del Gato</span>
                <div className={`game-top-bar__timer ${lowTime ? 'timer-low' : ''}`}>⏱ {formatTime(timeLeft)}</div>
            </div>

            {/* Progress */}
            <div className="game-progress-row">
                <div className="game-progress-bar-bg">
                    <div className="game-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="game-progress-label">{matchedPairs.length}/{gameWords.length}</span>
            </div>

            {/* Fixed-aspect board */}
            <div className="tripas-stage">
                <div
                    className="tripas-board"
                    ref={boardRef}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <svg className="tripas-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {matchedLines.map((line) => (
                            <polyline
                                key={line.wordId}
                                className="tripas-line-matched"
                                points={line.points.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
                            />
                        ))}
                        {draftPoints && draftPoints.length > 1 && (
                            <polyline
                                className="tripas-line-draft"
                                points={draftPoints.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
                            />
                        )}
                    </svg>

                    {leftCards.map(renderCard)}
                    {rightCards.map(renderCard)}
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

export default TripasGameView;
