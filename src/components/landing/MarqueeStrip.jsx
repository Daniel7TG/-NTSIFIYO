import React from 'react';
import '../../styles/components/landing/LandingAnimations.css';

const phrases = [
    { mz: 'Jiasmaji', es: 'Buenos días' },
    { mz: 'Tsökuaji', es: 'Buenas noches' },
    { mz: 'Pokjú', es: 'Gracias' },
    { mz: '¿Jango ga chjüü?', es: '¿Cómo se llama?' },
    { mz: '¿Joko go jichi?', es: '¿Quién le enseñó?' },
    { mz: '¿Mbeka gi kjaji?', es: '¿Qué hacen?' },
    { mz: 'Jñatrjo', es: 'Lengua Mazahua' },
    { mz: "Nts'i Fíyo", es: 'Aprender jugando' },
    { mz: 'Dyoji', es: 'Agua' },
    { mz: 'Nzaki', es: 'Vida' },
];

const MarqueeStrip = () => {
    const content = phrases.map((p, i) => (
        <span key={i} className="marquee-strip__item">
            <strong>{p.mz}</strong>
            <span className="marquee-strip__separator">✦</span>
            <em>{p.es}</em>
            <span className="marquee-strip__separator marquee-strip__separator--dim">•</span>
        </span>
    ));

    return (
        <div className="marquee-strip">
            <div className="marquee-strip__track">
                <div className="marquee-strip__content">
                    {content}
                    {content}
                </div>
            </div>
        </div>
    );
};

export default MarqueeStrip;
