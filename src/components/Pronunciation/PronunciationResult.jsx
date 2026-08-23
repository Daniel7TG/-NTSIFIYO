import React, { useState } from 'react';

/**
 * Presentación de cada PronunciationStatus devuelto por
 * POST /api/pronunciation/validate/{wordId}
 */
const STATUS_STYLES = {
    CORRECT: {
        title: '¡Muy bien!',
        icon: 'celebration',
        color: '#16a34a',
        soft: 'bg-green-50 border-green-100 text-green-700',
        message: 'Tu pronunciación coincide con la palabra.'
    },
    INCORRECT_DIFFERENT_WORD: {
        title: 'Escuché otra palabra',
        icon: 'swap_horiz',
        color: '#d97706',
        soft: 'bg-amber-50 border-amber-100 text-amber-700',
        message: 'Sonó parecido a otra palabra del diccionario. Inténtalo otra vez.'
    },
    INCORRECT: {
        title: 'Casi lo logras',
        icon: 'refresh',
        color: '#dc2626',
        soft: 'bg-red-50 border-red-100 text-red-700',
        message: 'No reconocí la palabra. Escucha el audio de ejemplo y vuelve a intentarlo.'
    },
    SILENCE: {
        title: 'No te escuché',
        icon: 'mic_off',
        color: '#64748b',
        soft: 'bg-gray-50 border-gray-200 text-gray-600',
        message: 'La grabación está vacía o muy bajita. Acércate al micrófono e inténtalo de nuevo.'
    }
};

const FALLBACK_STYLE = STATUS_STYLES.INCORRECT;

/** El backend usa 2.0 cuando la palabra no tiene centroide en el modelo. */
const NO_CENTROID_DISTANCE = 2.0;

const PronunciationResult = ({ result }) => {
    const [showDetails, setShowDetails] = useState(false);

    if (!result) return null;

    const style = STATUS_STYLES[result.status] || FALLBACK_STYLE;
    const score = Math.max(0, Math.min(100, Number(result.score) || 0));

    // Palabra fuera del modelo: distancia 2.0 sin ser silencio. No es culpa del usuario.
    const wordNotCovered =
        result.status !== 'SILENCE' && Number(result.targetDistance) === NO_CENTROID_DISTANCE;

    return (
        <div className="animate-fade-in-up space-y-4">
            <div className={`rounded-2xl border p-5 flex items-start gap-4 ${style.soft}`}>
                <div
                    className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: style.color + '1a', color: style.color }}
                >
                    <span className="material-symbols-outlined text-[26px]">{style.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-black text-lg" style={{ color: style.color }}>{style.title}</h4>
                    <p className="text-sm font-medium mt-0.5">{style.message}</p>

                    {result.detectedWord && result.detectedWord !== result.targetWord && (
                        <p className="text-sm font-bold mt-2">
                            Escuché: <span className="underline">{result.detectedWord}</span>
                            {result.targetWord && <> · Esperaba: <span className="underline">{result.targetWord}</span></>}
                        </p>
                    )}
                </div>
            </div>

            {/* Puntuación */}
            <div className="kid-card p-5">
                <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Puntuación
                    </span>
                    <span className="font-black text-2xl" style={{ color: style.color }}>
                        {score.toFixed(1)}<span className="text-sm text-gray-400 font-bold"> / 100</span>
                    </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${score}%`, backgroundColor: style.color }}
                    />
                </div>
                <p className="text-xs text-gray-400 font-bold mt-2">
                    Se considera correcta a partir de 50 puntos.
                </p>
            </div>

            {wordNotCovered && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    <p className="text-sm font-medium">
                        El modelo todavía no tiene una referencia de esta palabra, así que no puede
                        calificarla bien. Prueba con otra palabra del tema.
                    </p>
                </div>
            )}

            {/* Detalles técnicos, plegados por defecto */}
            <div>
                <button
                    type="button"
                    onClick={() => setShowDetails(v => !v)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                    {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                    <span className="material-symbols-outlined text-[16px]">
                        {showDetails ? 'expand_less' : 'expand_more'}
                    </span>
                </button>

                {showDetails && (
                    <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm animate-fade-in">
                        {[
                            ['Estado', result.status],
                            ['Palabra objetivo', result.targetWord || '—'],
                            ['Palabra detectada', result.detectedWord || '—'],
                            ['Distancia objetivo', Number(result.targetDistance).toFixed(4)],
                            ['Distancia mínima', Number(result.minDistance).toFixed(4)],
                            ['Umbral', Number(result.threshold).toFixed(4)]
                        ].map(([label, value]) => (
                            <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</dt>
                                <dd className="font-bold text-gray-700 truncate" title={String(value)}>{value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>
        </div>
    );
};

export default PronunciationResult;
