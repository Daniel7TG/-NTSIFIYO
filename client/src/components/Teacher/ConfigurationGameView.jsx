import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/components/teacher/configurationGameStyles.css';
import DictionaryService from '../../services/DictionaryService';
import apiConfig from '../../services/apiConfig';
import CustomAlert from '../common/CustomAlert';
import { QUESTIONNAIRE_TYPES, PAIR_TYPES, MEDIA_TYPES, ACTIVITY_CONFIG } from '../../config/activityConfig';
import MediaService, { ContentType } from '../../services/MediaService';
import { GAME_CATEGORIES, GAME_TOPICS } from '../../utils/gameCategories';
import { useAlert } from '../../context/AlertContext';

const generateId = () => Math.random().toString(36).substr(2, 9);

/* ─────────────── Word Search Input ─────────────── */
const WordSearchInput = ({ value, onSelectWord, onChangeText, placeholder, words, wordId }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-select exact match if typed
    useEffect(() => {
        if (value && !wordId && words.length > 0) {
            const exactMatch = words.find(w => w.text?.toLowerCase() === value.trim().toLowerCase());
            if (exactMatch) {
                onSelectWord(exactMatch);
            }
        }
    }, [value, wordId, words, onSelectWord]);

    const filtered = useMemo(() => {
        if (!value || value.length < 1) return [];
        return words.filter(w => w.text?.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
    }, [value, words]);

    return (
        <div className="cfg-word-search" ref={ref}>
            <input
                type="text"
                className="cfg-input"
                placeholder={placeholder}
                value={value}
                onChange={e => { onChangeText(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
            />
            {open && filtered.length > 0 && (
                <div className="cfg-word-results">
                    {filtered.map(w => (
                        <div key={w.id} className="cfg-word-option" onClick={() => { onSelectWord(w); setOpen(false); }}>
                            <span>{w.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─────────────── Word Preview Cache ─────────────── */
const previewCache = new Map();

/* ─────────────── Word Preview (image + audio) ─────────────── */
const WordPreview = ({ wordId }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!wordId) { setPreview(null); return; }
        // Check cache first
        if (previewCache.has(wordId)) {
            setPreview(previewCache.get(wordId));
            return;
        }
        setLoading(true);
        apiConfig.get(`/api/dictionary/words/details/${wordId}`)
            .then(data => {
                // apiConfig.get returns parsed JSON directly (no .data wrapper)
                let result = null;
                if (Array.isArray(data) && data.length > 0) result = data[0];
                else if (data && !Array.isArray(data)) result = data;
                if (result) previewCache.set(wordId, result);
                setPreview(result);
            })
            .catch(() => setPreview(null))
            .finally(() => setLoading(false));
    }, [wordId]);

    if (!wordId) return <div className="cfg-preview-empty">🖼️ Selecciona una palabra</div>;
    if (loading) return <div className="cfg-preview-loading">Cargando…</div>;
    if (!preview) return <div className="cfg-preview-empty">Sin vista previa</div>;

    return (
        <div className="cfg-preview-box">
            {preview.urlImage && (
                <img src={preview.urlImage} alt="preview" className="cfg-preview-img" />
            )}
            {preview.urlAudio && (
                <audio src={preview.urlAudio} controls className="cfg-preview-audio" />
            )}
            {!preview.urlImage && !preview.urlAudio && (
                <div className="cfg-preview-empty">Sin recursos multimedia</div>
            )}
        </div>
    );
};

/* ─────────────── Switch Toggle ─────────────── */
const SwitchToggle = ({ label, icon, checked, onChange }) => (
    <div className="cfg-switch-row">
        <span className="cfg-switch-label">{icon && <span className="sw-icon">{icon}</span>}{label}</span>
        <label className="cfg-switch">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="cfg-slider"></span>
        </label>
    </div>
);

/* ─────────────── Config Card ─────────────── */
const ConfigCard = ({ title, dotClass, config, setConfig }) => {
    const handleMazahua = (v) => {
        // If mazahua is ON, text must be ON (mazahua defines the language of text)
        if (v) {
            setConfig({ ...config, isMazahua: true, showText: true });
        } else {
            setConfig({ ...config, isMazahua: false });
        }
    };

    const handleText = (v) => {
        // If turning text OFF, also turn mazahua OFF
        if (!v) {
            setConfig({ ...config, showText: false, isMazahua: false });
        } else {
            setConfig({ ...config, showText: v });
        }
    };

    return (
        <div className="cfg-config-card">
            <h3><span className={`cfg-dot ${dotClass}`}></span>{title}</h3>
            <div className="cfg-config-options">
                <SwitchToggle label="Imagen" icon="🖼️" checked={config.showImage} onChange={v => setConfig({ ...config, showImage: v })} />
                <SwitchToggle label="Texto" icon="📝" checked={config.showText} onChange={handleText} />
                <SwitchToggle label="Audio" icon="🔊" checked={config.playAudio} onChange={v => setConfig({ ...config, playAudio: v })} />
                <SwitchToggle label="Mazahua" icon="🗣️" checked={config.isMazahua} onChange={handleMazahua} />
            </div>
        </div>
    );
};

/* ─────────────── Config Badges (inline in labels) ─────────────── */
const ConfigBadges = ({ config, hasWord }) => (
    <span className="cfg-badges">
        {config.showImage && <span className={`cfg-mini-badge ${hasWord ? 'active' : ''}`}>🖼️</span>}
        {config.playAudio && <span className={`cfg-mini-badge ${hasWord ? 'active' : ''}`}>🔊</span>}
        {config.showText && (
            <span className="cfg-lang-badge">{config.isMazahua ? 'MAZ' : 'ESP'}</span>
        )}
    </span>
);

/* Game type constants imported from activityTypes.js */

/* ═══════════════ MAIN COMPONENT ═══════════════ */
const ConfigurationGameView = ({ onActivityCreated, redirectPath }) => {
    const { editId } = useParams();
    const { showAlert } = useAlert();
    const isEditMode = !!editId;

    const [loadingEdit, setLoadingEdit] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertConfig, setAlertConfig] = useState(null);
    const [interactionType, setInteractionType] = useState('QUESTIONNAIRE');
    const [gameType, setGameType] = useState('QUESTIONNAIRE');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [experience, setExperience] = useState(0);
    const [difficult, setDifficult] = useState('EASY');
    const [selectedTopic, setSelectedTopic] = useState(GAME_TOPICS[0].id);

    const [words, setWords] = useState([]);
    
    const [questions, setQuestions] = useState([]);
    const [pairs, setPairs] = useState([]);

    // Config cards state
    const [config1, setConfig1] = useState({ showImage: false, showText: true, playAudio: false, isMazahua: false, order: 1 });
    const [config2, setConfig2] = useState({ showImage: false, showText: true, playAudio: false, isMazahua: false, order: 2 });

    // Media mode state
    const [mediaId, setMediaId] = useState(null);
    const [allowSpanishToggle, setAllowSpanishToggle] = useState(false);

    // When interaction type changes, reset gameType to the first subtype of that interaction
    const handleInteractionChange = (type) => {
        setInteractionType(type);
        if (type === 'PAIRS') {
            setGameType(PAIR_TYPES[0]);
        } else {
            setGameType(QUESTIONNAIRE_TYPES[0]);
        }
    };

    // Always load dictionary words for word search inputs
    useEffect(() => {
        DictionaryService.getAllWords().then(r => { if (r.success && Array.isArray(r.data)) setWords(r.data); });
        if (!isEditMode) {
            setPairs([makePair()]);
            setQuestions([makeQuestion()]);
        }
    }, []); // eslint-disable-line

    // If edit mode: fetch game AND dictionary words, then pre-fill form
    useEffect(() => {
        if (!isEditMode) return;
        setLoadingEdit(true);

        // Load both the game and the word dictionary in parallel
        Promise.all([
            apiConfig.get(`/api/games/${editId}`),
            DictionaryService.getAllWords().then(r => (r.success && Array.isArray(r.data)) ? r.data : [])
        ])
            .then(([game, wordList]) => {
                // Build a lookup map: wordId -> word text
                const wordMap = {};
                wordList.forEach(w => { wordMap[w.id] = w.text || ''; });
                // Also update words state so search inputs work
                if (wordList.length > 0) setWords(wordList);

                const isPairs = PAIR_TYPES.includes(game.gameType);
                const isMedia = MEDIA_TYPES.includes(game.gameType);
                const iType = isPairs ? 'PAIRS' : isMedia ? 'MEDIA' : 'QUESTIONNAIRE';
                setInteractionType(iType);
                
                let defaultType = QUESTIONNAIRE_TYPES[0];
                if (isPairs) defaultType = PAIR_TYPES[0];
                if (isMedia) defaultType = MEDIA_TYPES[0];
                
                setGameType(game.gameType || defaultType);
                setTitle(game.title || '');
                setDescription(game.description || '');
                setExperience(game.experience || 0);
                setDifficult(game.difficult || 'EASY');

                if (isMedia) {
                    setMediaId(game.mediaId || null);
                    // Extract allowSpanishToggle from config if we decided to put it there
                    if (game.gameConfigs && game.gameConfigs[0]) {
                        setAllowSpanishToggle(game.gameConfigs[0].showText); // We use showText or create a new field
                    }
                }

                if (game.gameCategory) {
                    const topic = GAME_TOPICS.find(t => t.id === game.gameCategory);
                    if (topic) {
                        setSelectedTopic(topic.id);
                    } else {
                        setSelectedTopic(game.gameCategory);
                    }
                }

                // Config cards — sorted by order
                const cfgs = Array.isArray(game.gameConfigs) ? [...game.gameConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
                if (cfgs[0]) {
                    setConfig1({ showImage: cfgs[0].showImage, showText: cfgs[0].showText, playAudio: cfgs[0].playAudio, isMazahua: cfgs[0].isMazahua, order: 1 });
                }
                if (cfgs[1]) setConfig2({ showImage: cfgs[1].showImage, showText: cfgs[1].showText, playAudio: cfgs[1].playAudio, isMazahua: cfgs[1].isMazahua, order: 2 });

                // Pairs mode: rebuild pairs from wordIds
                if (isPairs && Array.isArray(game.wordIds) && game.wordIds.length > 0) {
                    const builtPairs = game.wordIds.map(wId => ({
                        id: generateId(),
                        text: wordMap[wId] || String(wId ?? ''),
                        wordId: wId
                    }));
                    setPairs(builtPairs.length > 0 ? builtPairs : [makePair()]);
                    setQuestions([makeQuestion()]);

                    // Quiz mode: rebuild questions
                } else if (!isPairs && Array.isArray(game.questions) && game.questions.length > 0) {
                    const builtQuestions = game.questions.map(q => ({
                        id: generateId(),
                        question: q.question || '',
                        wordId: q.wordId ?? null,
                        sw: q.wordId ? (wordMap[q.wordId] || '') : '',
                        answers: (q.answers || []).map(a => ({
                            id: generateId(),
                            answerText: a.answerText || '',
                            wordId: a.wordId ?? null,
                            sw: a.wordId ? (wordMap[a.wordId] || '') : '',
                            isCorrect: !!a.isCorrect
                        }))
                    }));
                    setQuestions(builtQuestions);
                    setPairs([makePair()]);
                } else {
                    setPairs([makePair()]);
                    setQuestions([makeQuestion()]);
                }
            })
            .catch(err => {
                console.error('Error loading game for edit:', err);
                setAlertConfig({
                    mode: 'error',
                    title: 'Error de carga',
                    message: 'Error al cargar la actividad: ' + err.message,
                    buttons: [{ text: 'Cerrar', type: 'accept' }]
                });
            })
            .finally(() => setLoadingEdit(false));
    }, [editId]); // eslint-disable-line

    const makePair = () => ({ id: generateId(), text: '', wordId: null });
    const makeQuestion = () => ({
        id: generateId(), question: '', wordId: null, sw: '',
        answers: [
            { id: generateId(), answerText: '', wordId: null, sw: '', isCorrect: true },
            { id: generateId(), answerText: '', wordId: null, sw: '', isCorrect: false },
            { id: generateId(), answerText: '', wordId: null, sw: '', isCorrect: false },
            { id: generateId(), answerText: '', wordId: null, sw: '', isCorrect: false },
        ]
    });

    const totalItems = interactionType === 'PAIRS' ? pairs.length : questions.length;
    const recXP = totalItems * (difficult === 'EASY' ? 10 : difficult === 'MEDIUM' ? 15 : 20);

    /* ── Pair helpers ── */
    const updatePair = (id, data) => setPairs(ps => ps.map(p => p.id === id ? { ...p, ...data } : p));
    const removePair = id => { if (pairs.length > 1) setPairs(ps => ps.filter(p => p.id !== id)); };

    /* ── Question helpers ── */
    const updateQ = (id, data) => setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...data } : q));
    const removeQ = id => { if (questions.length > 1) setQuestions(qs => qs.filter(q => q.id !== id)); };

    const addAnswer = qId => setQuestions(qs => qs.map(q =>
        q.id === qId && q.answers.length < 6
            ? { ...q, answers: [...q.answers, { id: generateId(), answerText: '', wordId: null, sw: '', isCorrect: false }] }
            : q
    ));

    const removeAnswer = (qId, aId) => setQuestions(qs => qs.map(q => {
        if (q.id !== qId || q.answers.length <= 2) return q;
        const list = q.answers.filter(a => a.id !== aId);
        if (!list.some(a => a.isCorrect)) list[0].isCorrect = true;
        return { ...q, answers: list };
    }));

    const setCorrectAnswer = (qId, aId) => setQuestions(qs => qs.map(q =>
        q.id !== qId ? q : { ...q, answers: q.answers.map(a => ({ ...a, isCorrect: a.id === aId })) }
    ));

    const updateAnswer = (qId, aId, data) => setQuestions(qs => qs.map(q =>
        q.id !== qId ? q : { ...q, answers: q.answers.map(a => a.id === aId ? { ...a, ...data } : a) }
    ));

    const validateForm = () => {
        if (!title || title.trim() === '') return "El nombre del juego (título) no puede estar vacío.";
        if (!description || description.trim() === '') return "La descripción del juego no puede estar vacía.";
        if (!gameType) return "El tipo de juego es obligatorio.";
        if (!difficult) return "La dificultad del juego es obligatoria.";
        if (!selectedTopic) return "El tema/categoría específica del juego es obligatorio.";
        if (!experience || experience <= 0) return "La experiencia debe ser un valor numérico positivo mayor a 0.";
        if (totalItems <= 0 && interactionType !== 'MEDIA') return "El juego debe tener al menos un ítem (pregunta o par).";

        if (interactionType === 'MEDIA') {
            if (!mediaId) return "Debe seleccionar un recurso multimedia de la lista.";
        } else if (interactionType === 'PAIRS') {
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                if (!pair.wordId) {
                    return `El par ${i + 1} requiere seleccionar una palabra.`;
                }
            }
        } else {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.question || q.question.trim() === '') {
                    return `El estímulo de la pregunta ${i + 1} no puede estar vacío.`;
                }
                if ((config1.showImage || config1.playAudio) && !q.wordId) {
                    return `El estímulo de la pregunta ${i + 1} requiere seleccionar una palabra base porque tiene habilitado Imagen o Audio.`;
                }
                let correctCount = 0;
                for (let j = 0; j < q.answers.length; j++) {
                    const a = q.answers[j];
                    if (a.isCorrect) correctCount++;
                    if ((config2.showImage || config2.playAudio) && !a.wordId) {
                        return `La opción ${j + 1} de la pregunta ${i + 1} requiere seleccionar una palabra base porque tiene habilitado Imagen o Audio.`;
                    }
                }
                if (correctCount !== 1) {
                    return `La pregunta ${i + 1} debe tener exactamente una respuesta correcta.`;
                }
            }
        }
        return null;
    };

    const navigate = useNavigate();

    /* ── Submit ── */
    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) {
            setAlertConfig({
                mode: 'alert',
                title: 'Error de Validación',
                message: validationError,
                buttons: [{ text: 'Entendido', type: 'accept' }]
            });
            return;
        }

        setIsSubmitting(true);
        const dto = {
            gameType, title, description,
            experience: experience || recXP,
            difficult,
            gameTopic: selectedTopic,
            totalQuestions: totalItems,
            wordIds: [],
            questions: [],
            gameConfigs: [config1, config2],
            mediaId: interactionType === 'MEDIA' ? mediaId : null
        };

        if (interactionType === 'PAIRS') {
            dto.wordIds = pairs.filter(p => p.wordId).map(p => p.wordId);
        } else {
            dto.questions = questions.map(q => ({
                question: q.question,
                wordId: q.wordId,
                answers: q.answers.map(a => ({ answerText: a.answerText, isCorrect: a.isCorrect, wordId: a.wordId }))
            }));
        }

        try {
            let result;
            if (isEditMode) {
                result = await apiConfig.put(`/api/games/${editId}`, dto);
            } else {
                result = await apiConfig.post('/api/games', dto);
            }

            // Show global success alert (persists across navigation)
            showAlert({
                mode: 'success',
                title: '¡Éxito!',
                message: isEditMode
                    ? 'Juego actualizado con éxito.'
                    : 'Juego creado con éxito.',
                buttons: [{ text: 'Aceptar', type: 'accept' }]
            });

            // Navigate back immediately or call the callback
            if (redirectPath) {
                const finalPath = redirectPath.replace('{id}', result?.id || dto.id);
                navigate(finalPath);
            } else if (onActivityCreated) {
                onActivityCreated(result || dto);
            } else {
                navigate('/maestro/recursos');
            }
        } catch (err) {
            let errorMessage = `Error al ${isEditMode ? 'actualizar' : 'crear'} el juego.`;
            let dataBox = [];

            if (err.response && err.response.data) {
                const { message, validationErrors } = err.response.data;
                if (message) errorMessage = message;

                if (validationErrors) {
                    dataBox = Object.entries(validationErrors).map(([key, val]) => ({
                        label: key,
                        value: val
                    }));
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setAlertConfig({
                mode: 'error',
                title: 'Error de validación o servidor',
                message: errorMessage,
                dataBox: dataBox.length > 0 ? dataBox : undefined,
                buttons: [{ text: 'Cerrar', type: 'accept' }]
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasWord = wId => wId !== null && wId !== undefined;

    /* ═══════════════ RENDER ═══════════════ */
    if (loadingEdit || isSubmitting) {
        const loadingText = loadingEdit
            ? 'Cargando actividad para editar...'
            : (isEditMode ? 'Actualizando actividad...' : 'Creando actividad...');

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#6b7280', fontFamily: 'inherit' }}>{loadingText}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cfg-game-root no-sidebar">
            {/* ─── TWO-COLUMN LAYOUT ─── */}
            <div className="cfg-layout-body">
                {/* ─── LEFT SIDEBAR (fixed general config) ─── */}
                <aside className="cfg-left-sidebar">
                    <button className="cfg-btn-back" onClick={() => window.history.back()}>
                        ⬅ Regresar
                    </button>
                    <div className="cfg-sidebar-card">
                        <h3 className="cfg-sidebar-card-title">⚙️ General</h3>
                        <div className="cfg-sidebar-section">
                            <label>Nombre</label>
                            <input className="cfg-input" placeholder="Nombre del juego" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="cfg-sidebar-section">
                            <label>Descripción</label>
                            <textarea className="cfg-input" placeholder="Describe la actividad..." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="cfg-sidebar-section">
                            <label>Dificultad</label>
                            <div className="cfg-diff-group">
                                {['EASY', 'MEDIUM', 'HARD'].map(d => (
                                    <button
                                        key={d}
                                        className={`cfg-diff-btn ${difficult === d ? `active-${d.toLowerCase()}` : ''}`}
                                        onClick={() => setDifficult(d)}
                                    >
                                        {d === 'EASY' ? '😊' : d === 'MEDIUM' ? '🤔' : '🔥'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="cfg-sidebar-section">
                            <label>XP</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input className="cfg-input" type="number" value={experience} onChange={e => setExperience(parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                                <span className="cfg-xp-hint">⭐ {recXP}</span>
                            </div>
                        </div>
                        <div className="cfg-sidebar-section">
                            <label>Interacción</label>
                            <div className="cfg-toggle-group">
                                <button className={`cfg-toggle-btn ${interactionType === 'QUESTIONNAIRE' ? 'active' : ''}`} onClick={() => handleInteractionChange('QUESTIONNAIRE')}>Quiz</button>
                                <button className={`cfg-toggle-btn ${interactionType === 'PAIRS' ? 'active' : ''}`} onClick={() => handleInteractionChange('PAIRS')}>Pares</button>
                            </div>
                        </div>
                        <div className="cfg-sidebar-section">
                            <label>Tipo de Juego</label>
                            <div className="cfg-game-type-list">
                                {(interactionType === 'PAIRS' ? PAIR_TYPES : QUESTIONNAIRE_TYPES).map(gt => {
                                    const game = ACTIVITY_CONFIG[gt];
                                    return (
                                        <button
                                            key={game.value}
                                            className={`cfg-game-type-btn ${gameType === game.value ? 'active' : ''}`}
                                            onClick={() => setGameType(game.value)}
                                        >
                                            <span className="cfg-game-type-icon">{game.icon}</span>
                                            <span className="cfg-game-type-info">
                                                <span className="cfg-game-type-name">{game.title}</span>
                                                <span className="cfg-game-type-sub">{game.subtitle}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="cfg-sidebar-section">
                            <label>Tema Específico</label>
                            <select
                                className="cfg-input cfg-select"
                                value={selectedTopic}
                                onChange={e => setSelectedTopic(e.target.value)}
                            >
                                {GAME_CATEGORIES.map(cat => (
                                    <optgroup key={cat.id} label={cat.label}>
                                        {GAME_TOPICS.filter(t => t.categoryId === cat.id).map(topic => (
                                            <option key={topic.id} value={topic.id}>{topic.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>
                </aside>

                {/* ─── RIGHT CONTENT ─── */}
                <main className="cfg-main-content">
                    <div className="cfg-section-heading">
                        <div className="cfg-heading-row">
                            <div>
                                <h2>{interactionType === 'PAIRS' ? 'Pares de Palabras' : interactionType === 'MEDIA' ? 'Contenido Multimedia' : 'Preguntas del Quiz'}</h2>
                                <p>{interactionType === 'PAIRS' ? 'Cada palabra forma un par consigo misma.' : interactionType === 'MEDIA' ? 'Selecciona un recurso multimedia y configura sus opciones.' : 'Diseña tus preguntas y define las opciones de respuesta.'}</p>
                            </div>
                            <button className="cfg-btn-publish" onClick={handleSubmit}>
                                {isEditMode ? '💾 Actualizar' : '🚀 Publicar'}
                            </button>
                        </div>
                    </div>

                    {/* Config Cards in main content */}
                    {interactionType !== 'MEDIA' && (
                        <div className="cfg-configs-row">
                            <ConfigCard
                                title={interactionType === 'PAIRS' ? 'Config. Elemento 1' : 'Config. Pregunta'}
                                dotClass="dot-1"
                                config={config1}
                                setConfig={setConfig1}
                            />
                            <ConfigCard
                                title={interactionType === 'PAIRS' ? 'Config. Elemento 2' : 'Config. Respuestas'}
                                dotClass="dot-2"
                                config={config2}
                                setConfig={setConfig2}
                            />
                        </div>
                    )}

                    {/* ─── ITEMS ─── */}
                    {interactionType === 'PAIRS' ? (
                        <>
                            <div className="cfg-pairs-grid">
                                {pairs.map((pair, idx) => (
                                    <div key={pair.id} className="cfg-pair-card">
                                        {pairs.length > 1 && (
                                            <button className="cfg-pair-delete" onClick={() => removePair(pair.id)}>✕</button>
                                        )}
                                        <span className="cfg-pair-number">{idx + 1}</span>
                                        <WordPreview wordId={pair.wordId} />
                                        <WordSearchInput
                                            words={words}
                                            value={pair.text}
                                            wordId={pair.wordId}
                                            placeholder="Buscar palabra..."
                                            onChangeText={t => updatePair(pair.id, { text: t, wordId: null })}
                                            onSelectWord={w => updatePair(pair.id, { text: w.text, wordId: w.id })}
                                        />
                                    </div>
                                ))}
                                <button className="cfg-pair-card cfg-pair-add" onClick={() => setPairs([...pairs, makePair()])}>
                                    <span className="add-icon">+</span>
                                    <span>Nuevo Par</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="cfg-items-list">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="cfg-item-card">
                                    <div className="cfg-item-header">
                                        <div className="cfg-item-number">
                                            <span className="num-badge">{idx + 1}</span>
                                            Pregunta {idx + 1}
                                        </div>
                                        <div className="cfg-item-status">
                                            {questions.length > 1 && <button className="cfg-btn-delete" onClick={() => removeQ(q.id)}>🗑️</button>}
                                        </div>
                                    </div>

                                    <div className="cfg-row">
                                        <div className="cfg-field">
                                            <span className="cfg-field-label">
                                                ❓ Estímulo de Pregunta <ConfigBadges config={config1} hasWord={hasWord(q.wordId)} />
                                            </span>
                                            <input
                                                className="cfg-input"
                                                placeholder="Escribe tu pregunta aquí..."
                                                value={q.question}
                                                onChange={e => updateQ(q.id, { question: e.target.value })}
                                            />
                                            <WordSearchInput
                                                words={words}
                                                value={q.sw}
                                                wordId={q.wordId}
                                                placeholder="Buscar palabra base..."
                                                onChangeText={t => updateQ(q.id, { sw: t, wordId: null })}
                                                onSelectWord={w => updateQ(q.id, { sw: w.text, wordId: w.id })}
                                            />
                                        </div>
                                        <div className="cfg-field">
                                            <WordPreview wordId={q.wordId} />
                                        </div>
                                    </div>

                                    <p className="cfg-answers-label">Configuración de Respuestas</p>
                                    <div className="cfg-answers-grid">
                                        {q.answers.map((ans, aIdx) => (
                                            <div key={ans.id} className={`cfg-answer-cell ${ans.isCorrect ? 'is-correct' : ''}`}>
                                                <div className="cfg-answer-top">
                                                    <span className="cfg-answer-label">Opción {aIdx + 1} <ConfigBadges config={config2} hasWord={hasWord(ans.wordId)} /></span>
                                                    <div className="cfg-answer-actions">
                                                        <span className="cfg-correct-text">Correcta</span>
                                                        <label className="cfg-correct-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={ans.isCorrect}
                                                                onChange={() => setCorrectAnswer(q.id, ans.id)}
                                                            />
                                                            <span className="cfg-correct-slider"></span>
                                                        </label>
                                                        {q.answers.length > 2 && (
                                                            <button className="cfg-btn-remove-ans" onClick={() => removeAnswer(q.id, ans.id)}>✕</button>
                                                        )}
                                                    </div>
                                                </div>
                                                <input
                                                    className="cfg-input"
                                                    placeholder="Texto de respuesta..."
                                                    value={ans.answerText}
                                                    onChange={e => updateAnswer(q.id, ans.id, { answerText: e.target.value })}
                                                />
                                                <WordSearchInput
                                                    words={words}
                                                    value={ans.sw}
                                                    wordId={ans.wordId}
                                                    placeholder="Palabra (opcional)..."
                                                    onChangeText={t => updateAnswer(q.id, ans.id, { sw: t, wordId: null })}
                                                    onSelectWord={w => updateAnswer(q.id, ans.id, { sw: w.text, wordId: w.id })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {q.answers.length < 6 && (
                                        <button className="cfg-btn-add-answer" onClick={() => addAnswer(q.id)}>
                                            + Añadir Respuesta
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button className="cfg-add-card" onClick={() => setQuestions([...questions, makeQuestion()])}>
                                <span className="add-icon">+</span>
                                <span>Agregar Nueva Pregunta</span>
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {alertConfig && (
                <CustomAlert
                    {...alertConfig}
                    onClose={() => setAlertConfig(null)}
                />
            )}
        </div>
    );
};

export default ConfigurationGameView;
