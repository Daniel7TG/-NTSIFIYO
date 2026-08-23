import React, { useState } from 'react';
import { useCoyote } from '../../context/CoyoteContext';
import '../../styles/components/common/CoyoteCompanion.css';

// Import images
import saludo from '../../assets/images/coyote/saludo.png';
import esperando from '../../assets/images/coyote/esperando.png';
import pensando from '../../assets/images/coyote/pensando.png';
import celebracion from '../../assets/images/coyote/celebracion.png';
import triste from '../../assets/images/coyote/triste.png';
import sorpresa from '../../assets/images/coyote/sorpresa.png';

// Import WebM video animations
import idleVideo from '../../assets/images/coyote/0706_transparent.webm';
import thinkingVideo from '../../assets/images/coyote/0701_transparent.webm';

const images = {
    saludo,
    esperando,
    pensando,
    celebracion,
    triste,
    sorpresa,
};

const CoyoteCompanion = () => {
    const { emotion, message, visible, position, setPosition } = useCoyote();
    const [isTeleporting, setIsTeleporting] = useState(false);
    const [smokeState, setSmokeState] = useState({ show: false, position: 'left' });

    const handleTeleportTrigger = () => {
        if (isTeleporting) return;
        setIsTeleporting(true);
        setSmokeState({ show: true, position: position });

        // Disappear into smoke, then move
        setTimeout(() => {
            setPosition(position === 'left' ? 'right' : 'left');
        }, 150);

        // Reappear on the other side
        setTimeout(() => {
            setIsTeleporting(false);
        }, 350);

        // Clear smoke puff
        setTimeout(() => {
            setSmokeState(prev => ({ ...prev, show: false }));
        }, 700);
    };

    const currentImage = images[emotion] || images.esperando;
    const isIdle = emotion === 'esperando';
    const isThinking = emotion === 'pensando';

    return (
        <>
            {/* Smoke puff overlay */}
            {smokeState.show && (
                <div className={`coyote-smoke-container smoke-${smokeState.position}`}>
                    <svg className="coyote-smoke-svg" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="22" className="smoke-bubble smoke-1" />
                        <circle cx="34" cy="40" r="16" className="smoke-bubble smoke-2" />
                        <circle cx="66" cy="40" r="16" className="smoke-bubble smoke-3" />
                        <circle cx="38" cy="62" r="14" className="smoke-bubble smoke-4" />
                        <circle cx="62" cy="62" r="14" className="smoke-bubble smoke-5" />
                        <circle cx="24" cy="50" r="12" className="smoke-bubble smoke-6" />
                        <circle cx="76" cy="50" r="12" className="smoke-bubble smoke-7" />
                        <circle cx="50" cy="28" r="14" className="smoke-bubble smoke-8" />
                        <circle cx="50" cy="72" r="12" className="smoke-bubble smoke-9" />
                        <circle cx="30" cy="30" r="10" className="smoke-bubble smoke-10" />
                        <circle cx="70" cy="30" r="10" className="smoke-bubble smoke-11" />
                        <circle cx="30" cy="70" r="10" className="smoke-bubble smoke-12" />
                        <circle cx="70" cy="70" r="10" className="smoke-bubble smoke-13" />
                        <circle cx="50" cy="50" r="24" className="smoke-bubble smoke-14" />
                        <circle cx="50" cy="50" r="20" className="smoke-bubble smoke-15" />
                    </svg>
                </div>
            )}

            {/* Coyote companion */}
            <div className={`coyote-container ${position === 'left' ? 'coyote-left' : 'coyote-right'} ${isTeleporting ? 'teleporting' : ''}`}>
                {message && (
                    <div 
                        className="coyote-bubble-wrapper"
                        onMouseEnter={handleTeleportTrigger}
                    >
                        <div className="coyote-bubble">
                            {message}
                        </div>
                    </div>
                )}
                <div 
                    className="coyote-img-wrapper"
                    onMouseEnter={handleTeleportTrigger}
                >
                    {isIdle ? (
                        <video
                            src={idleVideo}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="coyote-img"
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        />
                    ) : isThinking ? (
                        <video
                            src={thinkingVideo}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="coyote-img"
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        />
                    ) : (
                        <img src={currentImage} alt={`Coyote ${emotion}`} className="coyote-img" />
                    )}
                </div>
            </div>
        </>
    );
};

export default CoyoteCompanion;
