import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MediaService from '../../services/MediaService';
import '../../styles/components/common/mediaPlayerStyles.css';

const ProgressiveSubtitle = ({ text, className, duration }) => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return <p className={className}>{text}</p>;
    }

    // Total time for the animation (leave a tiny buffer so it finishes cleanly)
    const totalTime = Math.max(duration * 0.95, 0.5);
    const slot = totalTime / words.length;

    return (
        <p className={className}>
            {words.map((word, i) => (
                <span
                    key={i}
                    className="subtitle-word"
                    style={{
                        animationDelay: `${(slot * i).toFixed(3)}s`,
                        animationDuration: `${slot.toFixed(3)}s`,
                    }}
                >
                    {word}
                </span>
            ))}
        </p>
    );
};

const MediaPlayerView = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const fetchIdRef = useRef(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mediaData, setMediaData] = useState(null);

    const [currentMazText, setCurrentMazText] = useState('...');
    const [currentEspText, setCurrentEspText] = useState('...');
    const [cueKey, setCueKey] = useState(0);
    const [mazCueDuration, setMazCueDuration] = useState(3);
    const [espCueDuration, setEspCueDuration] = useState(3);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const title = location.state?.title || 'Contenido Multimedia';
    const allowSpanishToggle = location.state?.allowSpanishToggle ?? true;
    const overviewImage = location.state?.overviewImage || null;
    const mediaType = location.state?.mediaType || null;
    const [showSpanish, setShowSpanish] = useState(false);

    const isAudio = mediaData?.url?.toLowerCase().endsWith('.mp3') || mediaType === 'SONG';

    const bumpCueKey = useCallback(() => setCueKey(k => k + 1), []);

    useEffect(() => {
        const fetchId = ++fetchIdRef.current;

        const fetchMedia = async () => {
            try {
                setLoading(true);
                setError(null);
                const streamData = await MediaService.getMediaStream(id);
                if (fetchId === fetchIdRef.current) {
                    setMediaData(streamData);
                }
            } catch (err) {
                if (fetchId === fetchIdRef.current) {
                    console.error('Error cargando el reproductor:', err);
                    setError('No se pudo cargar el contenido. Por favor intenta más tarde.');
                }
            } finally {
                if (fetchId === fetchIdRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchMedia();
    }, [id]);

    useEffect(() => {
        if (!videoRef.current || !mediaData) return;

        const video = videoRef.current;
        const tracks = video.textTracks;

        for (let i = 0; i < tracks.length; i++) {
            tracks[i].mode = 'hidden';
        }

        const handleMazCue = (e) => {
            const activeCues = e.target.activeCues;
            if (activeCues && activeCues.length > 0) {
                const cue = activeCues[0];
                setCurrentMazText(cue.text);
                setMazCueDuration(Math.max(0.5, cue.endTime - cue.startTime));
            } else {
                setCurrentMazText('...');
                setMazCueDuration(3);
            }
            bumpCueKey();
        };

        const handleEspCue = (e) => {
            const activeCues = e.target.activeCues;
            if (activeCues && activeCues.length > 0) {
                const cue = activeCues[0];
                setCurrentEspText(cue.text);
                setEspCueDuration(Math.max(0.5, cue.endTime - cue.startTime));
            } else {
                setCurrentEspText('...');
                setEspCueDuration(3);
            }
            bumpCueKey();
        };

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.label === 'Mazahua') {
                track.addEventListener('cuechange', handleMazCue);
            }
            if (track.label === 'Español') {
                track.addEventListener('cuechange', handleEspCue);
            }
        }

        return () => {
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                track.removeEventListener('cuechange', handleMazCue);
                track.removeEventListener('cuechange', handleEspCue);
            }
        };
    }, [mediaData, bumpCueKey]);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="media-player-container player-loading">
                <div className="spinner"></div>
                <p>Cargando multimedia...</p>
            </div>
        );
    }

    if (error || !mediaData) {
        return (
            <div className="media-player-container player-loading">
                <p style={{ color: '#ef4444' }}>{error || 'Error desconocido'}</p>
                <button className="btn-back" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="media-player-container">
            <div className="player-header">
                <h2 className="player-title">{title}</h2>
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
                </button>
            </div>

            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    className="main-video"
                    crossOrigin="anonymous"
                    src={mediaData.url}
                    poster={isAudio ? overviewImage : undefined}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onClick={isAudio ? undefined : togglePlay}
                    style={isAudio ? { objectFit: 'cover' } : undefined}
                >
                    {mediaData.mazSubtitlesUrl && (
                        <track
                            kind="subtitles"
                            src={mediaData.mazSubtitlesUrl}
                            srcLang="maz"
                            label="Mazahua"
                        />
                    )}
                    {mediaData.espSubtitlesUrl && (
                        <track
                            kind="subtitles"
                            src={mediaData.espSubtitlesUrl}
                            srcLang="es"
                            label="Español"
                        />
                    )}
                </video>
                {isAudio && (
                    <div className="audio-overlay" onClick={togglePlay}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3.5rem' }}>
                            {isPlaying ? 'pause_circle' : 'play_circle'}
                        </span>
                    </div>
                )}
            </div>

            <div className="custom-controls">
                <div className="progress-bar-wrapper">
                    <span className="time-display">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="progress-slider"
                    />
                    <span className="time-display">{formatTime(duration)}</span>
                </div>

                <div className="controls-row">
                    <button className="btn-control" onClick={togglePlay}>
                        <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                            {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                    </button>

                    {allowSpanishToggle && (
                        <div className="subtitles-options">
                            <span className="subtitles-label">Traducción (Esp)</span>
                            <label className="subtitle-switch">
                                <input
                                    type="checkbox"
                                    checked={showSpanish}
                                    onChange={e => setShowSpanish(e.target.checked)}
                                />
                                <span className="subtitle-slider"></span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="subtitles-display">
                <ProgressiveSubtitle
                    key={`maz-${cueKey}`}
                    text={currentMazText}
                    className="sub-mazahua"
                    duration={mazCueDuration}
                />
                {allowSpanishToggle && showSpanish && (
                    <ProgressiveSubtitle
                        key={`esp-${cueKey}`}
                        text={currentEspText}
                        className="sub-spanish"
                        duration={espCueDuration}
                    />
                )}
            </div>
        </div>
    );
};

export default MediaPlayerView;
