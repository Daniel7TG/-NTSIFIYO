import React from 'react';

const RoleSelection = () => {
    const roles = [
        { title: "Estudiante", icon: "school", desc: "Domina la lengua con lecciones interactivas y retroalimentación en tiempo real.", color: "blue" },
        { title: "Docente", icon: "cast_for_education", desc: "Accede a guías curriculares, hojas de trabajo y herramientas de gestión de clase.", color: "orange" },
        { title: "Visitante", icon: "travel_explore", desc: "Explora la rica historia, textiles y tradiciones del pueblo Mazahua.", color: "purple" }
    ];

    return (
        <section className="py-12 bg-white dark:bg-surface-dark border-y border-gray-100 dark:border-white/5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-white">Elige tu Camino</h2>
                    <p className="mt-4 text-lg text-text-sub-light dark:text-text-sub-dark">Recursos diseñados específicamente para tus necesidades.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roles.map((role, idx) => (
                        <div key={idx} className="group p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-background-light dark:bg-background-dark hover:border-primary/50 transition-all">
                            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${role.color}-100 text-${role.color}-600`}>
                                <span className="material-symbols-outlined text-2xl">{role.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{role.title}</h3>
                            <p className="text-text-sub-light dark:text-text-sub-dark mb-6">{role.desc}</p>
                            <button className="text-primary-dark font-bold hover:underline">Ir ahora →</button>



                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RoleSelection;