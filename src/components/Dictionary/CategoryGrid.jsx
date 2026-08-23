import React from 'react';
import { darken } from '../../utils/colorUtils';

// Import SVG SVGs
import IconAnimales from '../../assets/svgs/diccionario/topic_animales.svg';
import IconFrutas from '../../assets/svgs/diccionario/topic_frutas.svg';
import IconComida from '../../assets/svgs/diccionario/topic_comida.svg';
import IconRopa from '../../assets/svgs/diccionario/topic_ropa.svg';
import IconCuerpo from '../../assets/svgs/diccionario/topic_cuerpo.svg';
import IconSentidos from '../../assets/svgs/diccionario/topic_sentidos.svg';
import IconSaludos from '../../assets/svgs/diccionario/topic_saludos.svg';
import IconColores from '../../assets/svgs/diccionario/topic_colores.svg';
import IconVocales from '../../assets/svgs/diccionario/topic_vocales.svg';
import IconPronombres from '../../assets/svgs/diccionario/topic_pronombres.svg';
import IconLeyendas from '../../assets/svgs/diccionario/topic_leyendas.svg';
import IconAnecdotas from '../../assets/svgs/diccionario/topic_anecdotas.svg';
import IconCanciones from '../../assets/svgs/diccionario/topic_canciones.svg';
import IconPoemas from '../../assets/svgs/diccionario/topic_poemas.svg';

const topicIconMap = {
    'ANIMALS': IconAnimales,
    'FRUITS': IconFrutas,
    'FOOD': IconComida,
    'CLOTHES': IconRopa,
    'BODY_PARTS': IconCuerpo,
    'FIVE_SENSES': IconSentidos,
    'GREETINGS': IconSaludos,
    'COLORS': IconColores,
    'VOWELS': IconVocales,
    'PRONOUNS': IconPronombres,
    'LEGENDS': IconLeyendas,
    'ANECDOTES': IconAnecdotas,
    'SONGS': IconCanciones,
    'POEMS': IconPoemas,
};

// Color de acento vibrante por tema
const topicColorMap = {
    'VOWELS': '#7c3aed',
    'PRONOUNS': '#2563eb',
    'CLOTHES': '#db2777',
    'FOOD': '#ea580c',
    'ANIMALS': '#16a34a',
    'FRUITS': '#dc2626',
    'BODY_PARTS': '#0891b2',
    'FIVE_SENSES': '#0d9488',
    'GREETINGS': '#f59e0b',
    'COLORS': '#9333ea',
    'LEGENDS': '#4f46e5',
    'ANECDOTES': '#059669',
    'SONGS': '#e11d48',
    'POEMS': '#d97706',
};

const FALLBACK_COLOR = '#E65100';

const CategoryGrid = ({ topics, onSelectTopic }) => {
    if (!topics || topics.length === 0) {
        return (
            <div className="kid-card p-16 text-center flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-blue-300">category</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No hay temas disponibles</h3>
                <p className="text-gray-500 max-w-md">No se han encontrado temas registrados.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {topics.map((topic) => {
                const SvgIcon = topicIconMap[topic.id];
                const color = topicColorMap[topic.id] || FALLBACK_COLOR;

                return (
                    <button
                        key={topic.id}
                        onClick={() => onSelectTopic(topic.id)}
                        className="kid-card-dynamic p-6 group flex items-center gap-4 text-left w-full"
                        style={{ '--card-color': color, '--card-shadow': darken(color, 0.2) }}
                    >
                        <div
                            className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden p-1"
                            style={{ backgroundColor: color + '15' }}
                        >
                            {SvgIcon ? (
                                <img src={SvgIcon} alt={topic.label} className="w-full h-full object-contain" />
                            ) : (
                                <span className="material-symbols-outlined text-2xl" style={{ color }}>label</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-lg truncate" style={{ color }}>{topic.label}</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1 flex items-center gap-1">
                                Explorar<span className="material-symbols-outlined text-[14px]" style={{ color }}>chevron_right</span>
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default CategoryGrid;
