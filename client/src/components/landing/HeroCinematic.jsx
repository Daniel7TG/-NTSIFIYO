import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import L1 from '../../assets/landing/L1.webp';
import L2 from '../../assets/landing/L2.webp';
import L3 from '../../assets/landing/L3.webp';
import L4 from '../../assets/landing/L4.webp';
import L5 from '../../assets/landing/L5.webp';
import L6 from '../../assets/landing/L6.webp';
import L7 from '../../assets/landing/L7.webp';
import L8 from '../../assets/landing/L8.webp';
import '../../styles/components/landing/HeroCinematic.css';

const images = [L2, L3, L4, L5, L6, L7, L8];

const HeroCinematic = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    /* Auto-advance carousel */
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % images.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    /* Parallax offset for hero content */
    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <section className="hero-cinematic" id="hero">
            {/* Background slides */}
            <div className="hero-cinematic__slides">
                {images.map((img, i) => (
                    <div
                        key={i}
                        className={`hero-cinematic__slide ${i === activeIndex ? 'hero-cinematic__slide--active' : ''}`}
                        style={{ backgroundImage: `url(${img})` }}
                    />
                ))}
            </div>

            {/* Dark overlay */}
            <div className="hero-cinematic__overlay" />

            {/* Content with parallax */}
            <div
                className="hero-cinematic__content"
                style={{ transform: `translateY(${scrollY * 0.25}px)` }}
            >
                <span className="hero-cinematic__badge">
                    🌿 Plataforma Educativa en Lengua Mazahua
                </span>

                <h1 className="hero-cinematic__title">
                    Revitaliza tus Raíces:
                    <br />
                    <span className="hero-cinematic__title-accent">Aprende Jñatrjo</span>
                </h1>

                <p className="hero-cinematic__subtitle">
                    Conéctate con la tradición a través de una experiencia de aprendizaje
                    moderna diseñada para estudiantes, educadores y entusiastas de la cultura.
                    El Jñatrjo vive en ti.
                </p>

                <div className="hero-cinematic__actions">
                    <Link
                        to="/auth"
                        state={{ mode: 'register' }}
                        className="hero-cinematic__btn hero-cinematic__btn--primary"
                    >
                        Crear cuenta gratis
                    </Link>
                    <Link
                        to="/auth"
                        state={{ mode: 'login' }}
                        className="hero-cinematic__btn hero-cinematic__btn--outline"
                    >
                        Iniciar sesión
                    </Link>
                </div>
            </div>

            {/* Slide indicators */}
            <div className="hero-cinematic__indicators">
                {images.map((_, i) => (
                    <button
                        key={i}
                        className={`hero-cinematic__dot ${i === activeIndex ? 'hero-cinematic__dot--active' : ''}`}
                        onClick={() => setActiveIndex(i)}
                        aria-label={`Imagen ${i + 1}`}
                    />
                ))}
            </div>

            {/* Scroll hint — click to go to next section */}
            <button
                className="hero-cinematic__scroll-hint"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                aria-label="Ir a la siguiente sección"
            >
                <span className="material-symbols-outlined">expand_more</span>
            </button>
        </section>
    );
};

export default HeroCinematic;
