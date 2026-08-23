import React from 'react';
import { Link } from 'react-router-dom';
import L1 from '../../assets/landing/L2.webp';
import '../../styles/components/landing/LandingAnimations.css';

const FinalCTA = () => (
    <section className="landing-section relative py-28 sm:py-36 overflow-hidden" id="cta-final">
        {/* Parallax background */}
        <div
            className="absolute inset-0 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url(${L1})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/80 via-black/70 to-primary/60" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="reveal">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                    ¿Listo para aprender
                    <span className="block" style={{ color: '#FFA726' }}>Jñatrjo?</span>
                </h2>
                <p className="text-lg text-white/75 leading-relaxed max-w-xl mx-auto mb-10">
                    Únete a una comunidad que celebra y preserva la lengua Mazahua.
                    Juega, escucha, lee y habla — tu viaje comienza ahora.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/auth"
                        state={{ mode: 'register' }}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-1"
                    >
                        <span className="material-symbols-outlined">rocket_launch</span>
                        Crear cuenta gratis
                    </Link>
                    <Link
                        to="/auth"
                        state={{ mode: 'login' }}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur border border-white/25 text-white font-bold text-lg hover:bg-white/20 transition-all hover:-translate-y-1"
                    >
                        Iniciar sesión
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

export default FinalCTA;
