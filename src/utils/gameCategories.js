export const GAME_CATEGORIES = [
    { id: 'SCHOOL', label: 'Escuela' },
    { id: 'COMMUNITY', label: 'Comunidad' },
    { id: 'KITCHEN', label: 'Cocina' },
    { id: 'FOREST', label: 'Bosque' },
    { id: 'FARM', label: 'Granja' },
    { id: 'MARKET', label: 'Mercado' },
    { id: 'CLINIC', label: 'Clínica' },
    { id: 'PARK', label: 'Parque' },
    { id: 'PLAIN', label: 'Llanura' }
];

export const GAME_TOPICS = [
    { id: 'VOWELS', label: 'Vocales', categoryId: 'SCHOOL' },
    { id: 'PRONOUNS', label: 'Pronombres', categoryId: 'SCHOOL' },
    { id: 'NUMBERS', label: 'Números', categoryId: 'SCHOOL' },
    // { id: 'SUBJECTS', label: 'Materias', categoryId: 'COMMUNITY' },
    { id: 'CLOTHES', label: 'Ropa', categoryId: 'COMMUNITY' },
    { id: 'FOOD', label: 'Comida', categoryId: 'KITCHEN' },
    { id: 'ANIMALS', label: 'Animales', categoryId: 'FARM' },
    { id: 'FRUITS', label: 'Frutas', categoryId: 'MARKET' },
    { id: 'BODY_PARTS', label: 'Partes del cuerpo', categoryId: 'CLINIC' },
    { id: 'FIVE_SENSES', label: 'Los cinco sentidos', categoryId: 'CLINIC' },
    { id: 'GREETINGS', label: 'Saludos', categoryId: 'PARK' },
    { id: 'COLORS', label: 'Colores', categoryId: 'PARK' }
];

/**
 * Temas navegables en el diccionario.
 * Vocales queda fuera: se practica en el módulo de pronunciación, no se explora
 * como tema del diccionario.
 */
export const DICTIONARY_TOPICS = GAME_TOPICS.filter(topic => topic.id !== 'VOWELS');
