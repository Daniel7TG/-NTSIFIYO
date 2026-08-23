// client/src/components/CultureSection.js
import React from 'react';

const CultureSection = () => {
    return (
        <section className="py-16 lg:py-24 overflow-hidden relative bg-white dark:bg-background-dark">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Imagen con Overlay */}
                    <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/mexico-landscape.jpg')" }}></div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                            <p className="text-white text-sm font-medium uppercase tracking-wider mb-1">Estado de México</p>
                            <p className="text-white text-xl font-bold">Preservando el Jñatrjo para futuras generaciones</p>
                        </div>
                    </div>

                    {/* Texto Descriptivo */}
                    <div className="order-1 lg:order-2">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="h-px w-8 bg-primary"></span>
                            <span className="text-primary-dark font-bold uppercase tracking-wide text-sm">Nuestra Herencia</span>
                        </div>
                        <h2 className="text-3xl font-black text-text-main-light dark:text-white sm:text-4xl mb-6">
                            Jñatrjo: Más que una lengua
                        </h2>
                        <p className="text-lg text-text-sub-light dark:text-text-sub-dark mb-6 leading-relaxed">
                            La lengua mazahua es un puente hacia nuestros antepasados. Al aprender Jñatrjo, no solo memorizas palabras; mantienes viva una cosmovisión vibrante.
                        </p>
                        <ul className="space-y-4">
                            {["Conéctate profundamente con las comunidades.", "Entiende el significado cultural de nuestras tradiciones.", "Apoya los esfuerzos de revitalización lingüística."].map((text, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary">check_circle</span>
                                    <p className="text-text-main-light dark:text-gray-300">{text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CultureSection;