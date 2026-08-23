import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../../context/GameContext';
import GameService from '../../../services/GameService';
import GameSummary from '../GamePanel/GameSummary';
import GameAlert from '../GamePanel/GameAlert';
import { generateWordSearch } from './wordSearchGenerator';
import '../../../styles/components/games/GameBase.css';
import '../../../styles/components/games/sopaLetras/SopaLetras.css';

const TIME_BY_DIFFICULTY = { EASY: 180, MEDIUM: 150, HARD: 120 };
const FOUND_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#0EA5E9', '#84CC16', '#F97316', '#8B5CF6'];

const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

// Cells along the straight line start→end, or null if not H/V/diagonal aligned.
const lineCells = (start, end) => {
    const dr = end.r - start.r;
    const dc = end.c - start.c;
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const sr = sign(dr), sc = sign(dc);
    const cells = [];
    for (let i = 0; i <= steps; i++) cells.push({ r: start.r + sr * i, c: start.c + sc * i });
    return cells;
};

const sameCells = (a, b) => a.length === b.length && a.every((p, i) => p.r === b[i].r && p.c === b[i].c);

const SopaLetrasGameView = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnToMap = location.state?.returnToMap;
    const { currentGameData } = useGame();

    const [loading, setLoading] = useState(true);
    const [board, setBoard] = useState({ size: 0, grid: [], placements: [] });
    const [clues, setClues] = useState([]); // {id, text, imageUrl, audioUrl, hiddenText}
    const [foundIds, setFoundIds] = useState([]);
    const [foundColors, setFoundColors] = useState({}); // "r-c" -> color

    const [selection, setSelection] = useState([]); // current drag cells
    const [gameState, setGameState] = useState('loading');
    const [timeLeft, setTimeLeft] = useState(150);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'correct' });
    const [responseLogs, setResponseLogs] = useState([]);

    const timerRef = useRef(null);
    const startDateRef = useRef(null);
    const gridRef = useRef(null);
    const dragStartRef = useRef(null);
    const foundIdsRef = useRef([]);

    const difficulty = (currentGameData?.difficulty || 'MEDIUM').toUpperCase();

    useEffect(() => { foundIdsRef.current = foundIds; }, [foundIds]);

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
        const clueCfg = configs[0] || { showText: false, showImage: true, playAudio: false, isMazahua: false };
        const hiddenCfg = configs[1] || { isMazahua: true };

        // Hidden word is ALWAYS text (mazahua or spanish per config).
        const entries = (data.words || []).map(w => {
            const hiddenText = hiddenCfg.isMazahua ? w.mazahuaWord : w.spanishWord;
            return {
                id: w.id,
                text: hiddenText || w.mazahuaWord || w.spanishWord || '',
                clue: {
                    text: clueCfg.showText ? (clueCfg.isMazahua ? w.mazahuaWord : w.spanishWord) : null,
                    imageUrl: clueCfg.showImage ? w.imageUrl : null,
                    audioUrl: clueCfg.playAudio ? w.audioUrl : null,
                },
            };
        }).filter(e => e.text);

        const result = generateWordSearch(entries.map(e => ({ id: e.id, text: e.text })), difficulty);

        // Only keep clues for words that actually got placed.
        const placedIds = new Set(result.placements.map(p => p.id));
        const cluesList = entries
            .filter(e => placedIds.has(e.id))
            .map(e => ({ id: e.id, hiddenText: e.text, ...e.clue }));

        setBoard(result);
        setClues(cluesList);
        setFoundIds([]);
        setFoundColors({});
        setSelection([]);
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
                if (prev <= 1) { clearInterval(timerRef.current); finishGame(foundIdsRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [gameState]); // eslint-disable-line

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const showAlert = (type) => setAlertConfig({ isOpen: true, type });
    const handleAlertClose = () => setAlertConfig({ isOpen: false, type: 'correct' });

    const playAudio = (url) => { if (url) new Audio(url).play().catch(() => {}); };

    // ─── Cell from pointer position ────────────────────────────────────────────
    const cellFromPoint = (x, y) => {
        const el = document.elementFromPoint(x, y)?.closest('[data-cell]');
        if (!el) return null;
        const [r, c] = el.getAttribute('data-cell').split('-').map(Number);
        return { r, c };
    };

    // ─── Drag handlers ─────────────────────────────────────────────────────────
    const handlePointerDown = (e, r, c) => {
        if (gameState !== 'playing') return;
        if (e.cancelable) e.preventDefault();
        dragStartRef.current = { r, c };
        setSelection([{ r, c }]);
        gridRef.current?.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!dragStartRef.current) return;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (!cell) return;
        const cells = lineCells(dragStartRef.current, cell);
        if (cells) setSelection(cells);
    };

    const handlePointerUp = (e) => {
        if (!dragStartRef.current) return;
        gridRef.current?.releasePointerCapture(e.pointerId);
        const sel = selection;
        dragStartRef.current = null;
        setSelection([]);
        if (sel.length < 2) return;

        // Match selection (forward or reverse) against an unfound placed word.
        const reversed = [...sel].reverse();
        const match = board.placements.find(p =>
            !foundIds.includes(p.id) && (sameCells(sel, p.cells) || sameCells(reversed, p.cells))
        );

        if (match) {
            const color = FOUND_COLORS[foundIds.length % FOUND_COLORS.length];
            setFoundColors(prev => {
                const next = { ...prev };
                match.cells.forEach(({ r, c }) => { next[`${r}-${c}`] = color; });
                return next;
            });
            playAudio(clues.find(cl => cl.id === match.id)?.audioUrl);
            showAlert('correct');
            setFoundIds(prev => {
                const updated = [...prev, match.id];
                if (updated.length === board.placements.length && board.placements.length > 0) {
                    setTimeout(() => finishGame(updated), 1000);
                }
                return updated;
            });
        } else {
            showAlert('incorrect');
        }
    };

    // ─── Finish ──────────────────────────────────────────────────────────────
    const finishGame = (finalFound) => {
        clearInterval(timerRef.current);
        const logs = clues.map(cl => ({
            questionId: null,
            answerId: cl.id,
            isCorrect: finalFound.includes(cl.id),
            wordText: cl.hiddenText,
        }));
        setResponseLogs(logs);
        setGameState('finished');
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    if (loading || gameState === 'loading') {
        return (
            <div className="game-loading-container">
                <div className="spinner" />
                <p>Generando Sopa de Letras...</p>
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
                gameId={gameIdParam || 14}
                startDate={startDateRef.current || new Date().toISOString()}
                correctAnswers={foundIds.length}
                totalQuestions={clues.length}
                responseLogs={responseLogs}
                onExit={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/encuentra_palabra')}
                onRetry={initGame}
            />
        );
    }

    const selectedSet = new Set(selection.map(p => `${p.r}-${p.c}`));
    const progressPercent = clues.length > 0 ? (foundIds.length / clues.length) * 100 : 0;
    const lowTime = timeLeft <= 15;

    return (
        <div className="game-container">
            {/* Header */}
            <div className="game-top-bar">
                <button
                    className="game-top-bar__back-btn"
                    onClick={() => returnToMap ? navigate('/estudiante/mapa') : navigate('/games/encuentra_palabra')}
                >‹</button>
                <span className="game-top-bar__title">Sopa de Letras</span>
                <div className={`game-top-bar__timer ${lowTime ? 'timer-low' : ''}`}>⏱ {formatTime(timeLeft)}</div>
            </div>

            {/* Progress */}
            <div className="game-progress-row">
                <div className="game-progress-bar-bg">
                    <div className="game-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="game-progress-label">{foundIds.length}/{clues.length}</span>
            </div>

            <div className="sopa-layout">
                {/* Grid */}
                <div className="sopa-grid-wrap">
                    <div
                        className="sopa-grid"
                        ref={gridRef}
                        style={{ gridTemplateColumns: `repeat(${board.size}, 1fr)` }}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        {board.grid.map((row, r) =>
                            row.map((letter, c) => {
                                const key = `${r}-${c}`;
                                const found = foundColors[key];
                                const selected = selectedSet.has(key);
                                return (
                                    <div
                                        key={key}
                                        data-cell={key}
                                        className={`sopa-cell ${selected ? 'selected' : ''} ${found ? 'found' : ''}`}
                                        style={found ? { background: found, borderColor: found } : undefined}
                                        onPointerDown={(e) => handlePointerDown(e, r, c)}
                                    >
                                        {letter}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Clue list */}
                <div className="sopa-clues">
                    <h3 className="sopa-clues-title">Encuentra:</h3>
                    <ul className="sopa-clues-list">
                        {clues.map(cl => {
                            const done = foundIds.includes(cl.id);
                            return (
                                <li key={cl.id} className={`sopa-clue ${done ? 'done' : ''}`}>
                                    {cl.imageUrl && <img src={cl.imageUrl} alt="" className="sopa-clue-img" />}
                                    <div className="sopa-clue-body">
                                        {cl.text && <span className="sopa-clue-text">{cl.text}</span>}
                                        {done && <span className="sopa-clue-answer">{cl.hiddenText}</span>}
                                    </div>
                                    {cl.audioUrl && (
                                        <button className="sopa-clue-audio" onClick={() => playAudio(cl.audioUrl)}>
                                            <span className="material-symbols-outlined">volume_up</span>
                                        </button>
                                    )}
                                    {done && <span className="sopa-clue-check">✓</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            <GameAlert
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                onClose={handleAlertClose}
                autoCloseDuration={900}
            />
        </div>
    );
};

export default SopaLetrasGameView;
