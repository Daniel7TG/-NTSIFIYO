import React from 'react';
import '../../styles/components/landing/LandingAnimations.css';

const modalities = [
    {
        icon: 'image',
        title: 'Imágenes',
        desc: 'Asocia palabras con imágenes reales de la cultura y la vida cotidiana Mazahua.',
        color: '#2563eb',
        gradient: 'from-blue-50 to-indigo-50',
    },
    {
        icon: 'volume_up',
        title: 'Audio',
        desc: 'Escucha pronunciaciones nativas grabadas por niños y adultos de la comunidad.',
        color: '#E65100',
        gradient: 'from-orange-50 to-amber-50',
    },
    {
        icon: 'description',
        title: 'Texto Bilingüe',
        desc: 'Lee en Mazahua y Español simultáneamente para un aprendizaje contextual completo.',
        color: '#10b981',
        gradient: 'from-emerald-50 to-teal-50',
    },
];

const MultimodalSection = () => (
    <section className="landing-section py-20 sm:py-28" id="multimodal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-14 reveal">
                <span className="landing-section__label" style={{ color: '#1E3A8A' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hub</span>
                    Experiencia Multimodal
                </span>
                <h2 className="landing-section__title">
                    Aprende con Todos tus Sentidos
                </h2>
                <p className="landing-section__subtitle mx-auto mt-3">
                    La plataforma utiliza imágenes, audios y textos en ambos idiomas para apoyar una inmersión completa en la lengua.
                </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {modalities.map((m, i) => (
                    <div
                        key={i}
                        className={`reveal reveal-delay-${i + 1}`}
                    >
                        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${m.gradient} border border-gray-100 p-8 text-center transition-all hover:shadow-xl hover:-translate-y-2 group h-full`}>
                            {/* Large icon */}
                            <div
                                className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
                                style={{ background: m.color + '15', color: m.color }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>{m.icon}</span>
                            </div>
                            <h3 className="font-bold text-xl text-gray-800 mb-3">{m.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>

                            {/* Decorative circle */}
                            <div
                                className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10"
                                style={{ background: m.color }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default MultimodalSection;
