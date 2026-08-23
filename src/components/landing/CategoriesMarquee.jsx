import React from 'react';
import '../../styles/components/landing/LandingAnimations.css';

const row1 = [
    { icon: 'pets', label: 'Animales' },
    { icon: 'palette', label: 'Colores' },
    { icon: 'pin', label: 'Números' },
    { icon: 'nutrition', label: 'Frutas' },
    { icon: 'accessibility_new', label: 'Cuerpo' },
    { icon: 'family_restroom', label: 'Familia' },
    { icon: 'checkroom', label: 'Ropa' },
    { icon: 'cottage', label: 'Casa' },
];

const row2 = [
    { icon: 'restaurant', label: 'Comida' },
    { icon: 'park', label: 'Naturaleza' },
    { icon: 'mood', label: 'Emociones' },
    { icon: 'calendar_month', label: 'Días' },
    { icon: 'event', label: 'Meses' },
    { icon: 'waving_hand', label: 'Saludos' },
    { icon: 'edit_note', label: 'Verbos' },
    { icon: 'school', label: 'Escuela' },
];

const Pill = ({ icon, label }) => (
    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur border border-gray-100 shadow-sm whitespace-nowrap mr-3 hover:border-primary/40 hover:shadow-md transition-all cursor-default">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
    </div>
);

const MarqueeRow = ({ items, reverse = false }) => {
    const pills = items.map((item, i) => <Pill key={i} {...item} />);
    return (
        <div
            className="overflow-hidden py-2 group"
            style={{ maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)' }}
        >
            <div
                className="flex w-max group-hover:[animation-play-state:paused]"
                style={{
                    animation: `${reverse ? 'marquee-scroll-reverse' : 'marquee-scroll'} 35s linear infinite`,
                }}
            >
                {pills}
                {pills}
            </div>
        </div>
    );
};

const CategoriesMarquee = () => (
    <section className="landing-section py-16 sm:py-24" id="categorias">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
            <div className="text-center reveal">
                <span className="landing-section__label" style={{ color: '#1E3A8A' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>category</span>
                    Vocabulario
                </span>
                <h2 className="landing-section__title">
                    Explora Categorías de Vocabulario
                </h2>
                <p className="landing-section__subtitle mx-auto mt-3">
                    Más de 16 categorías temáticas con palabras, imágenes y audio para dominar el vocabulario esencial.
                </p>
            </div>
        </div>

        <div className="reveal" style={{ transitionDelay: '0.2s' }}>
            <MarqueeRow items={row1} />
            <MarqueeRow items={row2} reverse />
        </div>
    </section>
);

export default CategoriesMarquee;
