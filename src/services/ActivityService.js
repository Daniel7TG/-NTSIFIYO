// client/src/services/ActivityService.js
// Servicio encargado de crear, validar y gestionar actividades

// Excepciones personalizadas
class ActivityIncompleteException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ActivityIncompleteException';
    }
}

class ActivityService {
    /**
     * CU-013: Crear Actividad
     * Paso 2: Completa datos base (nombre, descripción, dificultad)
     */
    validateActivityData(activityData) {
        const { name, description, difficulty, categoryId } = activityData;

        if (!name || name.trim().length === 0) {
            throw new Error('El nombre de la actividad es requerido');
        }

        if (!description || description.trim().length === 0) {
            throw new Error('La descripción es requerida');
        }

        if (!difficulty || !['fácil', 'medio', 'difícil'].includes(difficulty)) {
            throw new Error('La dificultad debe ser: fácil, medio o difícil');
        }

        if (!categoryId) {
            throw new Error('Debes seleccionar una categoría');
        }

        return true;
    }


    /**
     * CU-014: Validar antes de iniciar el juego
     * Paso 18: validateXP(value, config)
     */
    validateXPRange(xpValue, minXP = 50, maxXP = 500) {
        if (xpValue < minXP || xpValue > maxXP) {
            return {
                valid: false,
                error: `El XP debe estar entre ${minXP} y ${maxXP}`,
                errorType: 'InvalidXPException'
            };
        }
        return { valid: true };
    }

    /**
     * Obtener una actividad para jugar
     * CU-014: Validación inicial
     */
    // client/src/services/ActivityService.js

}

export default new ActivityService();
export { ActivityIncompleteException };