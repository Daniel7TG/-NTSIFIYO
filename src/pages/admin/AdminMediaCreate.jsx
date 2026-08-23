import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaService, { ContentType } from '../../services/MediaService';
import { useAlert } from '../../context/AlertContext';
import CustomAlert from '../../components/common/CustomAlert';
import '../../styles/components/admin/adminMediaCreate.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

const MEDIA_TYPES = [
    { value: ContentType.POEMAS, label: 'Poema' },
    { value: ContentType.LEYENDAS, label: 'Leyenda' },
    { value: ContentType.CUENTOS, label: 'Cuento' },
    { value: ContentType.CANCIONES, label: 'Canción' },
];

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatVTTTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const parseVTTTime = (stamp) => {
    const parts = stamp.trim().split(':');
    if (parts.length === 3) {
        const [h, m, s] = parts.map(Number);
        return h * 3600 + m * 60 + s;
    }
    return parseFloat(stamp) || 0;
};

const parseVTT = (content) => {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const entries = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (line.startsWith('WEBVTT') || line === '' || /^\d+$/.test(line)) {
            i++;
            continue;
        }
        const arrowIdx = line.indexOf('-->');
        if (arrowIdx !== -1) {
            const start = parseVTTTime(line.substring(0, arrowIdx));
            const end = parseVTTTime(line.substring(arrowIdx + 3));
            i++;
            const textLines = [];
            while (i < lines.length && lines[i].trim() !== '') {
                textLines.push(lines[i].trim());
                i++;
            }
            entries.push({
                id: generateId(),
                start,
                end,
                text: textLines.join(' ')
            });
        } else {
            i++;
        }
    }
    return entries;
};

const generateVTT = (subtitles) => {
    const sorted = [...subtitles].sort((a, b) => a.start - b.start);
    let vtt = 'WEBVTT\n\n';
    sorted.forEach((sub, i) => {
        const text = (sub.text || '').trim();
        if (!text) return;
        vtt += `${i + 1}\n`;
        vtt += `${formatVTTTime(sub.start)} --> ${formatVTTTime(sub.end)}\n`;
        vtt += `${text}\n\n`;
    });
    return vtt;
};

const makeSubtitle = () => ({ id: generateId(), start: 0, end: 0, text: '' });

const AdminMediaCreate = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mediaType, setMediaType] = useState(ContentType.POEMAS);
    const [seasonMonth, setSeasonMonth] = useState(1);
    const [difficult, setDifficult] = useState('EASY');

    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
    const [isAudio, setIsAudio] = useState(false);

    const [previewImage, setPreviewImage] = useState(null);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    const [mazSubtitles, setMazSubtitles] = useState([makeSubtitle()]);
    const [espSubtitles, setEspSubtitles] = useState([makeSubtitle()]);

    const [mazVTTFile, setMazVTTFile] = useState(null);
    const [mazVTTFileName, setMazVTTFileName] = useState('');
    const [espVTTFile, setEspVTTFile] = useState(null);
    const [espVTTFileName, setEspVTTFileName] = useState('');

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertConfig, setAlertConfig] = useState(null);

    useEffect(() => {
        return () => {
            if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
            if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
        };
    }, []); // eslint-disable-line

    const handleMediaFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
        const url = URL.createObjectURL(file);
        setMediaFile(file);
        setMediaPreviewUrl(url);
        setIsAudio(file.type.startsWith('audio/'));
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    };

    const handlePreviewImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
        setPreviewImage(file);
        setPreviewImageUrl(URL.createObjectURL(file));
    };

    const handleMazVTTUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setMazVTTFile(file);
        setMazVTTFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const parsed = parseVTT(ev.target.result);
            if (parsed.length > 0) {
                setMazSubtitles(parsed);
            }
        };
        reader.readAsText(file);
    };

    const handleEspVTTUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setEspVTTFile(file);
        setEspVTTFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const parsed = parseVTT(ev.target.result);
            if (parsed.length > 0) {
                setEspSubtitles(parsed);
            }
        };
        reader.readAsText(file);
    };

    const clearMazVTT = () => {
        setMazVTTFile(null);
        setMazVTTFileName('');
        setMazSubtitles([makeSubtitle()]);
    };

    const clearEspVTT = () => {
        setEspVTTFile(null);
        setEspVTTFileName('');
        setEspSubtitles([makeSubtitle()]);
    };

    const togglePlay = () => {
        const el = isAudio ? audioRef.current : videoRef.current;
        if (!el) return;
        if (isPlaying) {
            el.pause();
        } else {
            el.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        const el = isAudio ? audioRef.current : videoRef.current;
        if (el) {
            el.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleTimeUpdate = () => {
        const el = isAudio ? audioRef.current : videoRef.current;
        if (el) setCurrentTime(el.currentTime);
    };

    const handleLoadedMetadata = () => {
        const el = isAudio ? audioRef.current : videoRef.current;
        if (el) setDuration(el.duration);
    };

    const handleMediaEnded = () => {
        setIsPlaying(false);
    };

    const skipBack = () => {
        const el = isAudio ? audioRef.current : videoRef.current;
        if (el) {
            el.currentTime = Math.max(0, el.currentTime - 5);
            setCurrentTime(el.currentTime);
        }
    };

    const skipForward = () => {
        const el = isAudio ? audioRef.current : videoRef.current;
        if (el) {
            el.currentTime = Math.min(el.duration, el.currentTime + 5);
            setCurrentTime(el.currentTime);
        }
    };

    const handleSetCurrentTime = (seconds) => {
        const el = isAudio ? audioRef.current : videoRef.current;
        if (el && el.duration) {
            el.currentTime = seconds;
            setCurrentTime(seconds);
        }
    };

    const updateMazSub = (id, field, value) => {
        setMazSubtitles(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: field === 'text' ? value : parseFloat(value) || 0 } : s
        ));
    };

    const updateEspSub = (id, field, value) => {
        setEspSubtitles(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: field === 'text' ? value : parseFloat(value) || 0 } : s
        ));
    };

    const removeMazSub = (id) => {
        if (mazSubtitles.length > 1) setMazSubtitles(prev => prev.filter(s => s.id !== id));
    };

    const removeEspSub = (id) => {
        if (espSubtitles.length > 1) setEspSubtitles(prev => prev.filter(s => s.id !== id));
    };

    const addMazSub = () => setMazSubtitles(prev => [...prev, makeSubtitle()]);
    const addEspSub = () => setEspSubtitles(prev => [...prev, makeSubtitle()]);

    const validateForm = () => {
        if (!title || title.trim() === '') return 'El título no puede estar vacío.';
        if (!description || description.trim() === '') return 'La descripción no puede estar vacía.';
        if (!mediaFile) return 'Debes seleccionar un archivo de video o audio.';
        if (!seasonMonth || seasonMonth < 1 || seasonMonth > 12) return 'Selecciona un mes válido (1-12).';

        const mazFilled = mazVTTFile || mazSubtitles.some(s => s.text.trim());
        const espFilled = espVTTFile || espSubtitles.some(s => s.text.trim());
        if (!mazFilled) return 'Debes escribir al menos un subtítulo en Mazahua.';
        if (!espFilled) return 'Debes escribir al menos un subtítulo en Español.';

        for (const sub of mazSubtitles) {
            if (sub.text.trim() && sub.end <= sub.start) {
                return 'Un subtítulo en Mazahua tiene tiempo final menor o igual al inicial.';
            }
        }
        for (const sub of espSubtitles) {
            if (sub.text.trim() && sub.end <= sub.start) {
                return 'Un subtítulo en Español tiene tiempo final menor o igual al inicial.';
            }
        }

        return null;
    };

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

        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('mediaType', mediaType);
            formData.append('seasonMonth', seasonMonth);
            formData.append('difficult', difficult);
            formData.append('mediaFile', mediaFile);

            if (previewImage) {
                formData.append('previewImage', previewImage);
            }

            if (mazVTTFile) {
                formData.append('mazSubtitles', mazVTTFile, mazVTTFileName || 'mazahua.vtt');
            } else {
                const mazVTT = new Blob([generateVTT(mazSubtitles)], { type: 'text/vtt' });
                formData.append('mazSubtitles', mazVTT, 'mazahua.vtt');
            }
            if (espVTTFile) {
                formData.append('espSubtitles', espVTTFile, espVTTFileName || 'espanol.vtt');
            } else {
                const espVTT = new Blob([generateVTT(espSubtitles)], { type: 'text/vtt' });
                formData.append('espSubtitles', espVTT, 'espanol.vtt');
            }

            await MediaService.uploadMedia(formData);

            showAlert({
                mode: 'success',
                title: '¡Éxito!',
                message: 'Contenido multimedia creado con éxito.',
                buttons: [{ text: 'Aceptar', type: 'accept' }]
            });

            navigate('/admin/contenido');
        } catch (err) {
            let errorMessage = 'Error al crear el contenido multimedia.';
            if (err.response && err.response.data) {
                const { message } = err.response.data;
                if (message) errorMessage = message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setAlertConfig({
                mode: 'error',
                title: 'Error',
                message: errorMessage,
                buttons: [{ text: 'Cerrar', type: 'accept' }]
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitting) {
        return (
            <div className="amc-loading-overlay">
                <div className="amc-loading-box">
                    <div className="amc-loading-spinner" />
                    <p>Creando contenido multimedia...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="amc-root">
            <div className="amc-top-bar">
                <button className="amc-btn-back" onClick={() => navigate('/admin/contenido')}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Regresar
                </button>
                <span className="amc-top-bar-title">Crear Contenido Multimedia</span>
                <button className="amc-btn-publish" onClick={handleSubmit}>
                    <span className="material-symbols-outlined">cloud_upload</span>
                    Publicar
                </button>
            </div>

            <div className="amc-layout-body">
                <aside className="amc-left-sidebar">
                    <div className="amc-sidebar-card">
                        <h3 className="amc-sidebar-card-title">
                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>tune</span>
                            General
                        </h3>

                        <div className="amc-sidebar-section">
                            <label>Título</label>
                            <input
                                className="amc-input"
                                placeholder="Título del contenido"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="amc-sidebar-section">
                            <label>Descripción</label>
                            <textarea
                                className="amc-input"
                                placeholder="Describe el contenido..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="amc-sidebar-section">
                            <label>Tipo de Contenido</label>
                            <select
                                className="amc-input amc-select"
                                value={mediaType}
                                onChange={e => setMediaType(e.target.value)}
                            >
                                {MEDIA_TYPES.map(mt => (
                                    <option key={mt.value} value={mt.value}>{mt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="amc-sidebar-section">
                            <label>Dificultad</label>
                            <div className="amc-diff-group">
                                {['EASY', 'MEDIUM', 'HARD'].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        className={`amc-diff-btn ${difficult === d ? `active-${d.toLowerCase()}` : ''}`}
                                        onClick={() => setDifficult(d)}
                                    >
                                        {d === 'EASY' ? 'Fácil' : d === 'MEDIUM' ? 'Medio' : 'Difícil'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="amc-sidebar-section">
                            <label>Mes de Temporada</label>
                            <select
                                className="amc-input amc-select"
                                value={seasonMonth}
                                onChange={e => setSeasonMonth(parseInt(e.target.value))}
                            >
                                {MONTHS.map((name, idx) => (
                                    <option key={idx} value={idx + 1}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="amc-sidebar-section">
                            <label>Archivo Multimedia (Video o Audio)</label>
                            <div className="amc-file-upload">
                                <div className="amc-file-input-wrapper">
                                    <input
                                        type="file"
                                        accept="video/*,audio/*"
                                        onChange={handleMediaFileChange}
                                    />
                                    <div className={`amc-file-label ${mediaFile ? 'has-file' : ''}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                                            {mediaFile ? 'check_circle' : 'upload_file'}
                                        </span>
                                        {mediaFile ? mediaFile.name : 'Seleccionar video o audio'}
                                    </div>
                                </div>
                                {mediaFile && (
                                    <span className="amc-file-hint">
                                        {isAudio ? 'Audio' : 'Video'} — {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="amc-sidebar-section">
                            <label>Imagen de Vista Previa (opcional)</label>
                            <div className="amc-file-upload">
                                <div className="amc-file-input-wrapper">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handlePreviewImageChange}
                                    />
                                    <div className={`amc-file-label ${previewImage ? 'has-file' : ''}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                                            {previewImage ? 'check_circle' : 'image'}
                                        </span>
                                        {previewImage ? previewImage.name : 'Seleccionar imagen'}
                                    </div>
                                </div>
                            </div>
                            {previewImageUrl && (
                                <img src={previewImageUrl} alt="Preview" className="amc-preview-img-thumb" />
                            )}
                        </div>
                    </div>
                </aside>

                <main className="amc-main-content">
                    <div className="amc-player-section">
                        <div className="amc-player-header">
                            <h3>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                                    {isAudio ? 'headphones' : 'play_circle'}
                                </span>
                                Vista Previa
                            </h3>
                            {mediaFile && (
                                <span className="amc-media-type-badge">
                                    {isAudio ? 'Audio' : 'Video'}
                                </span>
                            )}
                        </div>

                        {!mediaPreviewUrl ? (
                            <div className="amc-player-empty">
                                <span className="material-symbols-outlined amc-player-empty-icon">movie</span>
                                <p>Sin archivo seleccionado</p>
                                <span className="amc-player-empty-hint">
                                    Sube un video o audio en el panel izquierdo para previsualizarlo aquí
                                </span>
                            </div>
                        ) : isAudio ? (
                            <>
                                <div className="amc-audio-wrapper">
                                    <span className="material-symbols-outlined amc-audio-icon">headphones</span>
                                    <span className="amc-audio-label">{mediaFile?.name}</span>
                                    <audio
                                        ref={audioRef}
                                        src={mediaPreviewUrl}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onEnded={handleMediaEnded}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                    />
                                </div>
                                <div className="amc-player-controls">
                                    <div className="amc-progress-bar-wrapper">
                                        <span className="amc-time-display">{formatTime(currentTime)}</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 100}
                                            step="0.1"
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="amc-progress-slider"
                                        />
                                        <span className="amc-time-display">{formatTime(duration)}</span>
                                    </div>
                                    <div className="amc-controls-row">
                                        <button className="amc-btn-control" onClick={skipBack} title="Retroceder 5s">
                                            <span className="material-symbols-outlined">replay_5</span>
                                        </button>
                                        <button className="amc-btn-control" onClick={togglePlay}>
                                            <span className="material-symbols-outlined">
                                                {isPlaying ? 'pause' : 'play_arrow'}
                                            </span>
                                        </button>
                                        <button className="amc-btn-control" onClick={skipForward} title="Adelantar 5s">
                                            <span className="material-symbols-outlined">forward_5</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="amc-video-wrapper">
                                    <video
                                        ref={videoRef}
                                        src={mediaPreviewUrl}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onEnded={handleMediaEnded}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onClick={togglePlay}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </div>
                                <div className="amc-player-controls">
                                    <div className="amc-progress-bar-wrapper">
                                        <span className="amc-time-display">{formatTime(currentTime)}</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 100}
                                            step="0.1"
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="amc-progress-slider"
                                        />
                                        <span className="amc-time-display">{formatTime(duration)}</span>
                                    </div>
                                    <div className="amc-controls-row">
                                        <button className="amc-btn-control" onClick={skipBack} title="Retroceder 5s">
                                            <span className="material-symbols-outlined">replay_5</span>
                                        </button>
                                        <button className="amc-btn-control" onClick={togglePlay}>
                                            <span className="material-symbols-outlined">
                                                {isPlaying ? 'pause' : 'play_arrow'}
                                            </span>
                                        </button>
                                        <button className="amc-btn-control" onClick={skipForward} title="Adelantar 5s">
                                            <span className="material-symbols-outlined">forward_5</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="amc-subtitles-grid">
                        <div className="amc-subtitle-panel amc-panel-mazahua">
                            <div className="amc-subtitle-panel-header">
                                <h3>
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#E65100' }}>translate</span>
                                    Subtítulos Mazahua
                                </h3>
                                <div className="amc-vtt-upload-group">
                                    {mazVTTFileName ? (
                                        <div className="amc-vtt-file-tag">
                                            <span className="amc-vtt-file-name">{mazVTTFileName}</span>
                                            <button className="amc-btn-remove-sub" onClick={clearMazVTT} title="Quitar archivo">
                                                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="amc-vtt-upload-btn" title="Subir archivo VTT">
                                            <input
                                                type="file"
                                                accept=".vtt"
                                                onChange={handleMazVTTUpload}
                                                style={{ display: 'none' }}
                                            />
                                            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>upload_file</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="amc-subtitle-panel-body">
                                {mazSubtitles.map((sub) => (
                                    <div key={sub.id} className="amc-subtitle-row">
                                        <input
                                            type="number"
                                            className="amc-subtitle-time-input"
                                            placeholder="Inicio"
                                            value={sub.start || ''}
                                            onChange={e => updateMazSub(sub.id, 'start', e.target.value)}
                                            step="0.1"
                                            min="0"
                                        />
                                        <input
                                            type="number"
                                            className="amc-subtitle-time-input"
                                            placeholder="Fin"
                                            value={sub.end || ''}
                                            onChange={e => updateMazSub(sub.id, 'end', e.target.value)}
                                            step="0.1"
                                            min="0"
                                        />
                                        <input
                                            type="text"
                                            className="amc-subtitle-text-input"
                                            placeholder="Texto en mazahua..."
                                            value={sub.text}
                                            onChange={e => updateMazSub(sub.id, 'text', e.target.value)}
                                        />
                                        {mazSubtitles.length > 1 && (
                                            <button className="amc-btn-remove-sub" onClick={() => removeMazSub(sub.id)}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button className="amc-btn-add-sub" onClick={addMazSub}>
                                    + Añadir subtítulo
                                </button>
                            </div>
                        </div>

                        <div className="amc-subtitle-panel amc-panel-espanol">
                            <div className="amc-subtitle-panel-header">
                                <h3>
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#1E3A8A' }}>translate</span>
                                    Subtítulos Español
                                </h3>
                                <div className="amc-vtt-upload-group">
                                    {espVTTFileName ? (
                                        <div className="amc-vtt-file-tag">
                                            <span className="amc-vtt-file-name">{espVTTFileName}</span>
                                            <button className="amc-btn-remove-sub" onClick={clearEspVTT} title="Quitar archivo">
                                                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="amc-vtt-upload-btn" title="Subir archivo VTT">
                                            <input
                                                type="file"
                                                accept=".vtt"
                                                onChange={handleEspVTTUpload}
                                                style={{ display: 'none' }}
                                            />
                                            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>upload_file</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="amc-subtitle-panel-body">
                                {espSubtitles.map((sub) => (
                                    <div key={sub.id} className="amc-subtitle-row">
                                        <input
                                            type="number"
                                            className="amc-subtitle-time-input"
                                            placeholder="Inicio"
                                            value={sub.start || ''}
                                            onChange={e => updateEspSub(sub.id, 'start', e.target.value)}
                                            step="0.1"
                                            min="0"
                                        />
                                        <input
                                            type="number"
                                            className="amc-subtitle-time-input"
                                            placeholder="Fin"
                                            value={sub.end || ''}
                                            onChange={e => updateEspSub(sub.id, 'end', e.target.value)}
                                            step="0.1"
                                            min="0"
                                        />
                                        <input
                                            type="text"
                                            className="amc-subtitle-text-input"
                                            placeholder="Texto en español..."
                                            value={sub.text}
                                            onChange={e => updateEspSub(sub.id, 'text', e.target.value)}
                                        />
                                        {espSubtitles.length > 1 && (
                                            <button className="amc-btn-remove-sub" onClick={() => removeEspSub(sub.id)}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button className="amc-btn-add-sub" onClick={addEspSub}>
                                    + Añadir subtítulo
                                </button>
                            </div>
                        </div>
                    </div>
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

export default AdminMediaCreate;
