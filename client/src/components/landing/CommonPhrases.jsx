import React from 'react';
import '../../styles/components/landing/LandingAnimations.css';

const phrases = [
    { mz: 'Jiasmaji',        es: 'Buenos días',     icon: 'wb_sunny' },
    { mz: 'Tsökuaji',        es: 'Buenas noches',   icon: 'dark_mode' },
    { mz: 'Pokjú',           es: 'Gracias',         icon: 'favorite' },
    { mz: '¿Jango ga chjüü?', es: '¿Cómo se llama?', icon: 'badge' },
    { mz: '¿Joko go jichi?',  es: '¿Quién le enseñó?', icon: 'school' },
    { mz: '¿Mbeka gi kjaji?', es: '¿Qué hacen?',    icon: 'sentiment_satisfied' },
];

const CommonPhrases = () => (
    <section className="landing-section py-20 sm:py-28 bg-white" id="frases">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-14 reveal">
                <span className="landing-section__label" style={{ color: '#E65100' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>translate</span>
                    Frases Comunes
                </span>
                <h2 className="landing-section__title">
                    Frases que Conectan
                </h2>
                <p className="landing-section__subtitle mx-auto mt-3">
                    Aprende a formular frases cotidianas que te permiten comunicarte y conectar con la comunidad Mazahua.
                </p>
            </div>

            {/* Phrases grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {phrases.map((p, i) => (
                    <div
                        key={i}
                        className={`${i % 2 === 0 ? 'reveal-left' : 'reveal-right'} reveal-delay-${i + 1}`}
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-r from-orange-50/60 to-blue-50/60 p-5 transition-all hover:shadow-lg hover:-translate-y-1 group">
                            {/* Icon */}
                            <div className="absolute top-4 right-4 text-primary/15 group-hover:text-primary/25 transition-colors">
                                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>{p.icon}</span>
                            </div>

                            {/* Mazahua */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-6 rounded-full bg-primary shrink-0" />
                                <p className="text-lg font-bold text-gray-800">{p.mz}</p>
                            </div>

                            {/* Spanish */}
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-6 rounded-full bg-primary-dark shrink-0" />
                                <p className="text-sm text-gray-500">{p.es}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default CommonPhrases;
