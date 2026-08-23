import React from 'react';
import '../../styles/components/landing/LandingAnimations.css';

const games = [
    { icon: 'style',     title: 'Memoria Rápida', desc: 'Empareja tarjetas y aprende vocabulario.', color: '#E65100' },
    { icon: 'style',     title: 'Memorama',        desc: 'Encuentra pares de palabras y significados.', color: '#E65100' },
    { icon: 'quiz',      title: 'Quiz',            desc: 'Responde preguntas desafiantes.', color: '#7c3aed' },
    { icon: 'psychology',title: 'Intruso',          desc: 'Identifica la palabra que no pertenece.', color: '#d97706' },
    { icon: 'extension', title: 'Rompecabezas',     desc: 'Completa frases con la pieza correcta.', color: '#2563eb' },
    { icon: 'casino',    title: 'Lotería',          desc: 'Selecciona cartas contra reloj.', color: '#b45309' },
    { icon: 'route',     title: 'Laberinto',        desc: 'Traza el camino uniendo conceptos.', color: '#10b981' },
    { icon: 'link',      title: 'Pares',            desc: 'Enlaza cada palabra con su par correcto.', color: '#10b981' },
];

const GamesShowcase = () => (
    <section className="landing-section py-20 sm:py-28 bg-white" id="juegos">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-14 reveal">
                <span className="landing-section__label" style={{ color: '#E65100' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sports_esports</span>
                    Juegos Interactivos
                </span>
                <h2 className="landing-section__title">
                    Aprende Jugando
                </h2>
                <p className="landing-section__subtitle mx-auto mt-3">
                    8 tipos de juegos gamificados diseñados para que aprendas vocabulario, gramática y pronunciación sin darte cuenta.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {games.map((g, i) => (
                    <div
                        key={i}
                        className={`reveal reveal-delay-${i + 1} glass-card p-5 sm:p-6 text-center group cursor-default`}
                    >
                        <div
                            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                            style={{ background: g.color + '18', color: g.color }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{g.icon}</span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-1">{g.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{g.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default GamesShowcase;
