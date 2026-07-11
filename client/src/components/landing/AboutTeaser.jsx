import React from 'react';
import '../../styles/components/landing/LandingAnimations.css';
// import { Link } from 'react-router-dom';

const stats = [
    { number: 6,  label: 'Maestros y adultos hablantes', color: '#10B981', icon: 'school' },
    { number: 8,  label: 'Niños que prestaron voz',     color: '#F59E0B', icon: 'child_care' },
    { number: 6,  label: 'Desarrolladores',            color: '#6C63FF', icon: 'code' },
    { number: 6,  label: 'Otros colaboradores',         color: '#EC4899', icon: 'diversity_3' },
];

const AboutTeaser = () => (
    <section className="landing-section py-20 sm:py-28 bg-white" id="nosotros-teaser">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-14 reveal">
                <span className="landing-section__label" style={{ color: '#6C63FF' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>favorite</span>
                    Hecho por la comunidad
                </span>
                <h2 className="landing-section__title">
                    Un Proyecto Hecho con el Corazón
                </h2>
                <p className="landing-section__subtitle mx-auto mt-3">
                    Detrás de cada palabra, juego y sonido hay personas reales de la Escuela primaria bilingüe de manzanillos, Zitácuaro.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        className={`reveal reveal-delay-${i + 1} text-center`}
                    >
                        <div
                            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                            style={{ background: s.color + '18', color: s.color }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>{s.icon}</span>
                        </div>
                        <p
                            className="counter-animate text-4xl font-black mb-1"
                            data-target={s.number}
                            style={{ color: s.color }}
                        >
                            0
                        </p>
                        <p className="text-sm text-gray-500 font-medium leading-tight">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* CTA
            <div className="text-center reveal" style={{ transitionDelay: '0.5s' }}>
                <Link
                    to="/nosotros"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-primary/50 hover:text-primary transition-all group"
                >
                    Conocer al equipo
                    <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
            </div>
            */}
        </div>
    </section>
);

export default AboutTeaser;
