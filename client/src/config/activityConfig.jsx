import React from 'react';
import Roles from '../utils/roles';

import IconFastMemory from '../assets/svgs/juegos/memoria_rapida_premium.svg';
import IconQuiz from '../assets/svgs/juegos/quiz_premium.svg';
import IconIntruder from '../assets/svgs/juegos/intruso_premium.svg';
// import IconPuzzle from '../assets/svgs/juegos/rompecabezas_premium.svg';
import IconMemory from '../assets/svgs/juegos/memorama_premium.svg';
import IconLottery from '../assets/svgs/juegos/loteria_premium.svg';
import IconMaze from '../assets/svgs/juegos/laberinto_premium.svg';
import IconFindWord from '../assets/svgs/juegos/buscar_premium.svg';
import IconPairs from '../assets/svgs/juegos/pares_premium.svg';

// Custom icon renderer
const renderIcon = (src, alt) => <img src={src} alt={alt} className="w-full h-full object-contain drop-shadow-sm" style={{ maxWidth: '100%', maxHeight: '100%' }} />;

export const ActivityTypes = Object.freeze({
    QUESTIONNAIRE: "QUESTIONNAIRE",
    FAST_MEMORY: "FAST_MEMORY",
    INTRUDER: "INTRUDER",
    FIND_THE_WORD: "FIND_THE_WORD",
    MEDIA_SONG: "MEDIA_SONG",
    MEDIA_ANECDOTE: "MEDIA_ANECDOTE",
    MEDIA_LEGEND: "MEDIA_LEGEND",
    MEDIA_POEM: "MEDIA_POEM",
    // PUZZLE: "PUZZLE",
    MEMORY_GAME: "MEMORY_GAME",
    LOTTERY: "LOTTERY",
    MAZE: "MAZE",
    PAIRS: "PAIRS",
    CAT_LINES: "CAT_LINES",
    FILL_BLANK: "FILL_BLANK",
});

export const ACTIVITY_CONFIG = {
    [ActivityTypes.FAST_MEMORY]: {
        id: 'memoria_rapida',
        value: ActivityTypes.FAST_MEMORY,
        type: ActivityTypes.FAST_MEMORY,
        title: 'Memoria Rápida',
        label: 'Memoria Rápida',
        subtitle: 'Tarjetas de Memoria',
        description: 'Aprende vocabulario y pronunciación mazahua emparejando tarjetas interactivas. Ejercita tu memoria mientras descubres nuevas palabras.',
        icon: renderIcon(IconFastMemory, 'Memoria Rápida'),
        materialIcon: 'style',
        basePath: '/games/memoria_rapida',
        color: '#E65100',
        stats: [
            { icon: 'style', label: 'Tarjetas' },
            { icon: 'timer', label: 'Memoria' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.QUESTIONNAIRE]: {
        id: 'quiz',
        value: ActivityTypes.QUESTIONNAIRE,
        type: ActivityTypes.QUESTIONNAIRE,
        title: 'Quiz',
        label: 'Quiz',
        subtitle: 'Preguntas y Respuestas',
        description: 'Pon a prueba tus conocimientos del idioma mazahua con preguntas desafiantes. Evalúa gramática, vocabulario y comprensión.',
        icon: renderIcon(IconQuiz, 'Quiz'),
        materialIcon: 'quiz',
        basePath: '/games/quiz',
        color: '#7c3aed',
        stats: [
            { icon: 'quiz', label: 'Preguntas' },
            { icon: 'psychology', label: 'Conocimiento' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.INTRUDER]: {
        id: 'intruso',
        value: ActivityTypes.INTRUDER,
        type: ActivityTypes.INTRUDER,
        title: 'El Intruso',
        label: 'Intruso',
        subtitle: 'Encuentra al Intruso',
        description: 'Identifica qué palabra no pertenece al grupo. Mejora tu vocabulario y capacidad de categorización.',
        icon: renderIcon(IconIntruder, 'Intruso'),
        materialIcon: 'psychology',
        basePath: '/games/intruso',
        color: '#d97706',
        stats: [
            { icon: 'search', label: 'Atención' },
            { icon: 'category', label: 'Lógica' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    /*
    [ActivityTypes.PUZZLE]: {
        id: 'rompecabezas',
        value: ActivityTypes.PUZZLE,
        type: ActivityTypes.PUZZLE,
        title: 'Rompecabezas',
        label: 'Rompecabezas',
        subtitle: 'Completa la Frase',
        description: 'Selecciona la pieza correcta para completar la frase. Aprende vocabulario mazahua a través de frases contextuales en ejercicios prácticos.',
        icon: renderIcon(IconPuzzle, 'Rompecabezas'),
        materialIcon: 'extension',
        basePath: '/games/rompecabezas',
        color: '#2563eb',
        stats: [
            { icon: 'extension', label: 'Frases' },
            { icon: 'lightbulb', label: 'Contexto' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    */
    [ActivityTypes.MEMORY_GAME]: {
        id: 'memorama',
        value: ActivityTypes.MEMORY_GAME,
        type: ActivityTypes.MEMORY_GAME,
        title: 'Memorama',
        label: 'Memory Game',
        subtitle: 'Emparejar Pares',
        description: 'Voltea las cartas y encuentra todas las parejas. Aprende vocabulario mazahua emparejando palabras con su significado en español o imágenes.',
        icon: renderIcon(IconMemory, 'Memory Game'),
        materialIcon: 'style',
        basePath: '/games/memorama',
        color: '#E65100',
        stats: [
            { icon: 'style', label: 'Pares' },
            { icon: 'psychology', label: 'Memoria' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.LOTTERY]: {
        id: 'loteria',
        value: ActivityTypes.LOTTERY,
        type: ActivityTypes.LOTTERY,
        title: 'Lotería',
        label: 'Lotería',
        subtitle: 'Selecciona las cartas',
        description: 'Selecciona las cartas de tu tablero que coincidan con las que van apareciendo en la pila. ¡Rápido y sin penalizaciones para ganar más puntos!',
        icon: renderIcon(IconLottery, 'Lotería'),
        materialIcon: 'casino',
        basePath: '/games/loteria',
        color: '#b45309',
        stats: [
            { icon: 'casino', label: 'Cartas' },
            { icon: 'timer', label: 'Velocidad' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.MAZE]: {
        id: 'laberinto',
        value: ActivityTypes.MAZE,
        type: ActivityTypes.MAZE,
        title: 'Laberinto',
        label: 'Laberinto',
        subtitle: 'Traza el camino',
        description: 'Encuentra tu camino en el laberinto y une los conceptos sin equivocarte.',
        icon: renderIcon(IconMaze, 'Laberinto'),
        materialIcon: 'route',
        basePath: '/games/laberinto',
        color: '#10b981',
        stats: [
            { icon: 'route', label: 'Rutas' },
            { icon: 'timer', label: 'Velocidad' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.FIND_THE_WORD]: {
        id: 'encuentra_palabra',
        value: ActivityTypes.FIND_THE_WORD,
        type: ActivityTypes.FIND_THE_WORD,
        title: 'Sopa de Letras',
        label: 'Sopa de Letras',
        subtitle: 'Encuentra las palabras escondidas',
        description: 'Localiza cada palabra mazahua escondida en la cuadrícula de letras. Arrastra para marcar la palabra; según la dificultad la cuadrícula crece y aparecen más direcciones.',
        icon: renderIcon(IconFindWord, 'Sopa de Letras'),
        materialIcon: 'search',
        basePath: '/games/encuentra_palabra',
        color: '#0284c7',
        stats: [
            { icon: 'grid_on', label: 'Cuadrícula' },
            { icon: 'search', label: 'Atención' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.MEDIA_SONG]: {
        id: 'cancion',
        value: ActivityTypes.MEDIA_SONG,
        type: ActivityTypes.MEDIA_SONG,
        title: 'Canción',
        label: 'Canción',
        subtitle: 'Actividad con canción',
        description: 'Disfruta y aprende con esta actividad musical en mazahua.',
        icon: '🎵',
        materialIcon: 'music_note',
        basePath: '/games/cancion',
        color: '#db2777',
        stats: [
            { icon: 'music_note', label: 'Ritmo' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.MEDIA_ANECDOTE]: {
        id: 'anecdota',
        value: ActivityTypes.MEDIA_ANECDOTE,
        type: ActivityTypes.MEDIA_ANECDOTE,
        title: 'Anécdota',
        label: 'Anécdota',
        subtitle: 'Actividad con anécdota',
        description: 'Aprende del contexto y la historia mediante anécdotas.',
        icon: '📖',
        materialIcon: 'menu_book',
        basePath: '/games/anecdota',
        color: '#059669',
        stats: [
            { icon: 'menu_book', label: 'Lectura' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.MEDIA_LEGEND]: {
        id: 'leyenda',
        value: ActivityTypes.MEDIA_LEGEND,
        type: ActivityTypes.MEDIA_LEGEND,
        title: 'Leyenda',
        label: 'Leyenda',
        subtitle: 'Actividad con leyenda',
        description: 'Descubre historias tradicionales y expande tu conocimiento cultural.',
        icon: '🗺️',
        materialIcon: 'map',
        basePath: '/games/leyenda',
        color: '#7c3aed',
        stats: [
            { icon: 'map', label: 'Historia' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.MEDIA_POEM]: {
        id: 'poema',
        value: ActivityTypes.MEDIA_POEM,
        type: ActivityTypes.MEDIA_POEM,
        title: 'Poema',
        label: 'Poema',
        subtitle: 'Actividad con poema',
        description: 'Aprende vocabulario a través de la poesía y cultura mazahua.',
        icon: '📜',
        materialIcon: 'auto_stories',
        basePath: '/games/poema',
        color: '#f59e0b',
        stats: [
            { icon: 'auto_stories', label: 'Cultura' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.PAIRS]: {
        id: 'pares',
        value: ActivityTypes.PAIRS,
        type: ActivityTypes.PAIRS,
        title: 'Pares',
        label: 'Pares',
        subtitle: 'Enlaza los pares',
        description: 'Une las cartas del lado izquierdo con su par del lado derecho para completar los desafíos.',
        icon: renderIcon(IconPairs, 'Pares'),
        materialIcon: 'auto_stories',
        basePath: '/games/pares',
        color: '#10b981',
        stats: [
            { icon: 'link', label: 'Relación' },
            { icon: 'psychology', label: 'Lógica' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.CAT_LINES]: {
        id: 'tripas',
        value: ActivityTypes.CAT_LINES,
        type: ActivityTypes.CAT_LINES,
        title: 'Tripas del Gato',
        label: 'Tripas del Gato',
        subtitle: 'Une los pares con líneas',
        description: 'Traza líneas libres para unir cada carta con su par sin cruzar las líneas ya dibujadas. Completa todos los pares antes de que se acabe el tiempo.',
        icon: renderIcon(IconPairs, 'Tripas del Gato'),
        materialIcon: 'gesture',
        basePath: '/games/tripas',
        color: '#0ea5e9',
        stats: [
            { icon: 'gesture', label: 'Trazo' },
            { icon: 'timer', label: 'Tiempo' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    },
    [ActivityTypes.FILL_BLANK]: {
        id: 'fill_blank',
        value: ActivityTypes.FILL_BLANK,
        type: ActivityTypes.FILL_BLANK,
        title: 'Completar Oración',
        label: 'Completar Oración',
        subtitle: 'Rellena el espacio en blanco',
        description: 'Completa las oraciones seleccionando la palabra correcta para el espacio en blanco. Practica vocabulario y gramática mazahua en contexto.',
        icon: '📝',
        materialIcon: 'edit_note',
        basePath: '/games/fill_blank',
        color: '#0284c7',
        stats: [
            { icon: 'edit_note', label: 'Oraciones' },
            { icon: 'psychology', label: 'Contexto' },
            { icon: 'emoji_events', label: 'XP' }
        ]
    }
};

/** Categorías de Tipos de Juegos */
export const QUESTIONNAIRE_TYPES = [
    ActivityTypes.QUESTIONNAIRE,
    ActivityTypes.INTRUDER,
    ActivityTypes.FILL_BLANK,
    // ActivityTypes.FIND_THE_WORD,
    // ActivityTypes.PUZZLE,
];

export const PAIR_TYPES = [
    ActivityTypes.MEMORY_GAME,
    ActivityTypes.FAST_MEMORY,
    ActivityTypes.LOTTERY,
    ActivityTypes.MAZE,
    ActivityTypes.PAIRS,
    ActivityTypes.CAT_LINES,
    ActivityTypes.FIND_THE_WORD
];

export const MEDIA_TYPES = [
    ActivityTypes.MEDIA_SONG,
    ActivityTypes.MEDIA_ANECDOTE,
    ActivityTypes.MEDIA_LEGEND,
    ActivityTypes.MEDIA_POEM
];

/** Helpers */
export const getGameBasePath = (type) => ACTIVITY_CONFIG[type]?.basePath || '/dashboard';
export const getGameIcon = (type) => ACTIVITY_CONFIG[type]?.icon || '🎮';
export const getActivitiesList = () => Object.values(ACTIVITY_CONFIG).filter(
    a => a.type !== ActivityTypes.MEDIA_SONG &&
         a.type !== ActivityTypes.MEDIA_ANECDOTE &&
         a.type !== ActivityTypes.MEDIA_LEGEND &&
         a.type !== ActivityTypes.MEDIA_POEM
);

export const getGameTypeInfo = (type) => {
    const activity = ACTIVITY_CONFIG[type];
    if (activity) {
        return { label: activity.title, icon: activity.icon, color: activity.color || '#6b7280' };
    }
    return { label: type, icon: '🎮', color: '#6b7280' };
};

/**
 * Builds the navigation routes struct for `navigation.js`
 * Only returns types that have an active setup (some might not have create/edit routes yet, but all have play)
 */
export const getNavigationRoutes = () => {
    const activeGames = [
        ActivityTypes.MEMORY_GAME,
        ActivityTypes.QUESTIONNAIRE,
        ActivityTypes.INTRUDER,
        ActivityTypes.LOTTERY,
        // ActivityTypes.PUZZLE,
        ActivityTypes.FAST_MEMORY,
        ActivityTypes.MAZE,
        ActivityTypes.PAIRS,
        ActivityTypes.CAT_LINES,
        ActivityTypes.FILL_BLANK,
        ActivityTypes.FIND_THE_WORD
    ];

    return activeGames.map(type => {
        const config = ACTIVITY_CONFIG[type];
        return {
            id: config.id,
            label: config.title,
            path: config.basePath,
            icon: config.materialIcon,
            roles: [Roles.STUDENT, Roles.TEACHER, Roles.VISITOR],
            children: [
                { id: `${config.id}-create`, label: `Crear ${config.title}`, path: `${config.basePath}/crear`, roles: [Roles.TEACHER] },
                { id: `${config.id}-edit`, label: `Editar ${config.title}`, path: `${config.basePath}/editar/:editId`, roles: [Roles.TEACHER] },
                { id: `${config.id}-play`, label: `Jugar ${config.title}`, path: `${config.basePath}/jugar/:activityId`, roles: [Roles.STUDENT, Roles.TEACHER, Roles.VISITOR] },
            ],
        };
    });
};

export default ACTIVITY_CONFIG;
