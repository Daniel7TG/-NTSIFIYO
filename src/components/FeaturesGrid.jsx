// client/src/components/FeaturesGrid.js
import React from 'react';

const FeaturesGrid = () => {
    const features = [
        { icon: "record_voice_over", title: "Pronunciación Nativa", desc: "Aprende de hablantes nativos reales.", color: "green" },
        { icon: "quiz", title: "Quizzes Interactivos", desc: "Pon a prueba tus conocimientos con ejercicios gamificados.", color: "yellow" },
        { icon: "local_library", title: "Biblioteca Rica", desc: "Historias, poemas y canciones.", color: "rose" },
        { icon: "groups", title: "Comunidad", desc: "Comparte tu progreso con otros.", color: "indigo" }
    ];

    return (
        <section className="py-16 bg-surface-light dark:bg-surface-dark">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-background-light dark:bg-background-dark/50 border border-transparent hover:border-primary/20 transition-all">
                            <div className={`h-10 w-10 rounded-lg bg-${f.color}-100 text-${f.color}-600 flex items-center justify-center mb-4`}>
                                <span className="material-symbols-outlined">{f.icon}</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-text-main-light dark:text-white">{f.title}</h3>
                            <p className="text-sm text-text-sub-light dark:text-text-sub-dark">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ESTA LÍNEA ES LA QUE PROBABLEMENTE FALTA:
export default FeaturesGrid;