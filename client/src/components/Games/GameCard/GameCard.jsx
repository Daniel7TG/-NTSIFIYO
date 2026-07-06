// client/src/components/Games/GameCard/GameCard.jsx
import React, { useState } from 'react';
import useFitText from '../../../hooks/useFitText';
import '../../../styles/components/games/gameCard/GameCard.css';

/**
 * GameCard - Componente reutilizable para mostrar una carta con texto, imagen y/o audio.
 *
 * Props:
 *  - text      {string}  - Texto a mostrar
 *  - imageUrl  {string}  - URL de la imagen
 *  - audioUrl  {string}  - URL del audio
 *  - onClick   {fn}      - Handler al hacer click en la carta
 *  - selected  {string}  - 'correct' | 'incorrect' | null
 *  - disabled  {bool}    - Deshabilitar interacción
 *  - animationDelay {string} - CSS delay, e.g. '0.1s'
 */
const GameCard = ({
    text,
    imageUrl,
    audioUrl,
    onClick,
    selected,
    disabled,
    animationDelay,
}) => {
    const [playing, setPlaying] = useState(false);
    const centerTextRef = useFitText({ maxFontSize: 18, minFontSize: 8, text });
    const footerTextRef = useFitText({ maxFontSize: 15, minFontSize: 8, text });

    const hasImage = !!imageUrl;
    const hasText = !!text;
    const hasAudio = !!audioUrl;

    /** Determina el "modo" del card para aplicar el layout adecuado */
    const getMode = () => {
        if (hasImage && hasText && hasAudio) return 'image-text-audio';
        if (hasImage && hasText) return 'image-text';
        if (hasImage && hasAudio) return 'image-audio';
        if (hasText && hasAudio) return 'text-audio';
        if (hasImage) return 'image-only';
        if (hasText) return 'text-only';
        if (hasAudio) return 'audio-only';
        return 'empty';
    };

    const mode = getMode();

    const handleAudioClick = (e) => {
        e.stopPropagation();
        if (!audioUrl) return;
        const audio = new Audio(audioUrl);
        setPlaying(true);
        audio.play().catch(() => { });
        audio.onended = () => setPlaying(false);
    };

    const handleCardClick = () => {
        if (disabled) return;
        if (onClick) onClick();
    };

    const audioBtn = (
        <button
            className={`gc-audio-btn ${playing ? 'gc-audio-btn--playing' : ''}`}
            onClick={handleAudioClick}
            title="Reproducir audio"
        >
            <span className="material-symbols-outlined">{playing ? 'volume_up' : 'volume_up'}</span>
        </button>
    );

    const textFooter = (
        <div className="gc-text-footer">
            <span ref={footerTextRef}>{text}</span>
        </div>
    );

    /* ── Layout según modo ── */
    const renderContent = () => {
        switch (mode) {
            /* Solo texto */
            case 'text-only':
                return (
                    <div className="gc-body gc-body--center">
                        <span className="gc-text-center" ref={centerTextRef}>{text}</span>
                    </div>
                );

            /* Solo audio */
            case 'audio-only':
                return (
                    <div className="gc-body gc-body--center">
                        {audioBtn}
                    </div>
                );

            /* Texto + Audio */
            case 'text-audio':
                return (
                    <>
                        <div className="gc-body gc-body--center">
                            {audioBtn}
                        </div>
                        {textFooter}
                    </>
                );

            /* Solo imagen */
            case 'image-only':
                return (
                    <div className="gc-body gc-body--image">
                        <img src={imageUrl} alt="" className="gc-image" />
                    </div>
                );

            /* Imagen + Audio */
            case 'image-audio':
                return (
                    <div className="gc-body gc-body--image">
                        <img src={imageUrl} alt="" className="gc-image" />
                        <div className="gc-corner-audio">
                            {audioBtn}
                        </div>
                    </div>
                );

            /* Imagen + Texto */
            case 'image-text':
                return (
                    <div className="gc-body gc-body--image">
                        <img src={imageUrl} alt="" className="gc-image" />
                        {textFooter}
                    </div>
                );

            /* Imagen + Texto + Audio */
            case 'image-text-audio':
                return (
                    <div className="gc-body gc-body--image">
                        <img src={imageUrl} alt="" className="gc-image" />
                        {textFooter}
                        <div className="gc-corner-audio">
                            {audioBtn}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    /**
     * El card debe ser blanco cuando hay imagen (para que el fondo blanco de la imagen se mezcle).
     * En otros casos usa el color de tarjeta normal.
     */
    const cardClass = [
        'game-card',
        `game-card--${mode}`,
        selected === 'correct' ? 'game-card--correct' : '',
        selected === 'incorrect' ? 'game-card--incorrect' : '',
        disabled ? 'game-card--disabled' : '',
        'animate-pop',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cardClass}
            style={{ animationDelay: animationDelay || '0s' }}
            onClick={handleCardClick}
        >
            {renderContent()}
        </div>
    );
};

export default GameCard;
