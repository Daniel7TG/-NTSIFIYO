import React from 'react';

/** Alturas relativas de las barras del decorado (onda de sonido). */
const WAVE_BARS = [22, 46, 70, 38, 90, 58, 100, 44, 76, 30, 62, 24];

const STEPS = [
    { icon: 'headphones', label: 'Escucha el ejemplo' },
    { icon: 'mic', label: 'Grábate diciéndola' },
    { icon: 'check_circle', label: 'Recibe tu puntuación' }
];

/**
 * Encabezado del módulo de pronunciación: presentación, pasos y buscador.
 */
const PronunciationHero = ({ search, onSearchChange, wordCount, visibleCount, showCount }) => (
    // Fondo índigo plano con el borde y la sombra sólida de .kid-card-indigo.
    // El naranja queda sólo en el ícono y el chip: contrasta en vez de repetirse.
    <section className="relative overflow-hidden rounded-[28px] border-4 border-indigo-200 bg-[#EEF0FF] shadow-[0_8px_0_#8353ec]">

        {/* Onda decorativa */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden lg:flex items-center gap-2 pr-8 opacity-[0.14]" aria-hidden="true">
            {WAVE_BARS.map((height, idx) => (
                <span
                    key={idx}
                    className="w-2.5 rounded-full bg-[#8353ec]"
                    style={{ height: `${height}%` }}
                />
            ))}
        </div>
        <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-[#8353ec]/10 blur-2xl" aria-hidden="true" />

        <div className="relative p-6 sm:p-8 flex flex-col gap-7">

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#E65100] text-white flex items-center justify-center shadow-[0_5px_0_#C2410C]">
                        <span className="material-symbols-outlined text-[32px]">record_voice_over</span>
                    </div>

                    <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#E65100] bg-[#E65100]/10 border-2 border-[#E65100]/20 rounded-full px-3 py-1">
                            <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                            Practica tu voz
                        </span>

                        <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mt-2.5 leading-tight">
                            Pronunciación
                        </h2>
                        <p className="text-gray-500 font-medium mt-1.5 max-w-lg">
                            Elige una palabra y dila por el micrófono: te decimos qué escuchamos y qué
                            tan bien la pronunciaste.
                        </p>
                    </div>
                </div>

                {/* Buscador + contador */}
                <div className="w-full lg:w-80 shrink-0 space-y-2">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-[20px]">
                            search
                        </span>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Buscar palabra..."
                            aria-label="Buscar palabra"
                            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-indigo-200 rounded-2xl text-sm font-semibold text-gray-700 shadow-[0_3px_0_#c7d2fe] focus:border-[#8353ec] focus:ring-4 focus:ring-[#8353ec]/15 outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                        />
                    </div>

                    {showCount && (
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-indigo-500/80 text-right pr-1">
                            {search.trim()
                                ? `${visibleCount} de ${wordCount} palabras`
                                : `${wordCount} ${wordCount === 1 ? 'palabra disponible' : 'palabras disponibles'}`}
                        </p>
                    )}
                </div>
            </div>

            {/* Pasos */}
            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STEPS.map((step, idx) => (
                    <li
                        key={step.label}
                        className="flex items-center gap-3 bg-white border-2 border-indigo-200/70 rounded-2xl px-4 py-3"
                    >
                        <span className="w-9 h-9 shrink-0 rounded-xl bg-[#8353ec]/10 text-[#8353ec] flex items-center justify-center font-black text-sm border-2 border-[#8353ec]/15">
                            {idx + 1}
                        </span>
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-600 min-w-0">
                            <span className="material-symbols-outlined text-[20px] text-[#8353ec]/70 shrink-0">
                                {step.icon}
                            </span>
                            <span className="truncate">{step.label}</span>
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default PronunciationHero;
