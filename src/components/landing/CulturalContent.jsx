import React from 'react';
import L3 from '../../assets/landing/L3.webp';
import '../../styles/components/landing/LandingAnimations.css';

const items = [
    { icon: 'auto_stories', title: 'Historias',  desc: 'Descubre relatos que se han transmitido de generación en generación.', color: '#7c3aed' },
    { icon: 'chat_bubble',  title: 'Anécdotas',  desc: 'Aprende del contexto cultural a través de vivencias reales de la comunidad.', color: '#059669' },
    { icon: 'music_note',   title: 'Canciones',  desc: 'Canta en Mazahua con melodías tradicionales y modernas.', color: '#db2777' },
    { icon: 'edit_note',    title: 'Poemas',     desc: 'Siente la belleza lírica de la lengua a través de la poesía.', color: '#f59e0b' },
];

const CulturalContent = () => (
    <section className="landing-section relative py-28 sm:py-36 overflow-hidden" id="cultura">
        {/* Parallax background */}
        <div
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url(${L3})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-14 reveal">
                <span className="landing-section__label" style={{ color: '#FFA726' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_library</span>
                    Contenido Cultural
                </span>
                <h2 className="landing-section__title" style={{ color: 'white' }}>
                    Más que Palabras: Cultura Viva
                </h2>
                <p className="landing-section__subtitle mx-auto mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Sumérgete en historias, anécdotas, canciones y poemas que reflejan la riqueza del pueblo Mazahua.
                </p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className={`reveal reveal-delay-${i + 1} glass-card glass-card--dark p-6 text-center`}
                    >
                        <div
                            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: item.color + '30', color: item.color }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{item.icon}</span>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default CulturalContent;
