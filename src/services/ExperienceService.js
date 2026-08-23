// client/src/services/ExperienceService.js
// Servicio encargado de calcular experiencia (XP) y puntuaciones
class InvalidXPException extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidXPException';
    }
}

class ExperienceService {
    // Tabla de XP base según dificultad
    DIFFICULTY_MULTIPLIERS = {
        fácil: 1.0,
        medio: 1.5,
        difícil: 2.0
    };

    // Tabla de XP base según tipo de medio
    MEDIA_TYPE_XP = {
        Texto: 50,
        Imagen: 75,
        Audio: 100
    };

    // Rango permitido de XP
    MIN_XP = 50;
    MAX_XP = 500;

    /**
     * CU-013: Paso 4
     * Calcula el XP recomendado basado en dificultad y tipo de medio
     */
    async calculateRecommendedXP(difficulty, mediaType) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const baseXP = this.MEDIA_TYPE_XP[mediaType] || 50;
                const multiplier = this.DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
                const recommendedXP = Math.floor(baseXP * multiplier);

                resolve(recommendedXP);
            }, 300); // Simular latencia de API
        });
    }

    /**
     * CU-014: Paso 9
     * Calcula la puntuación en estrellas basada en el desempeño
     * Soporta Memorama clásico y Memoria Rápida
     */
    calculateStarRating(gameStats) {
        // Memoria Rápida — usa correctCards, totalCards, maxCombo
        if ('correctCards' in gameStats) {
            const { correctCards, totalCards, maxCombo = 0 } = gameStats;

            const accuracy = totalCards > 0 ? (correctCards / totalCards) * 100 : 0;
            const comboScore = Math.min(100, maxCombo * 10);

            // Fórmula: 50% precisión, 30% combo, 20% volumen de cartas
            const volumeScore = Math.min(100, totalCards * 5);
            const score = (accuracy * 0.5) + (comboScore * 0.3) + (volumeScore * 0.2);

            let stars = 0;
            if (score >= 80) stars = 5;
            else if (score >= 65) stars = 4;
            else if (score >= 50) stars = 3;
            else if (score >= 35) stars = 2;
            else if (score >= 20) stars = 1;

            return {
                score: Math.round(score),
                stars,
                successRate: Math.round(accuracy),
                comboScore: Math.round(comboScore),
                volumeScore: Math.round(volumeScore)
            };
        }

        // Memorama clásico — usa totalAttempts, correctMatches, totalPairs
        const {
            totalTime,
            totalAttempts,
            correctMatches,
            totalPairs,
            timeLimit = 300
        } = gameStats;

        const successRate = (correctMatches / totalPairs) * 100;
        const timeEfficiency = Math.max(0, 1 - (totalTime / timeLimit));
        const minAttempts = totalPairs;
        const attemptsEfficiency = Math.max(0, 1 - ((totalAttempts - minAttempts) / totalPairs));

        const score = (successRate * 0.4) +
            (timeEfficiency * 100 * 0.3) +
            (attemptsEfficiency * 100 * 0.3);

        let stars = 0;
        if (score >= 80) stars = 5;
        else if (score >= 65) stars = 4;
        else if (score >= 50) stars = 3;
        else if (score >= 35) stars = 2;
        else if (score >= 20) stars = 1;

        return {
            score: Math.round(score),
            stars,
            successRate: Math.round(successRate),
            timeEfficiency: Math.round(timeEfficiency * 100),
            attemptsEfficiency: Math.round(attemptsEfficiency * 100)
        };
    }

    /**
     * CU-014: Paso 8 y 18
     * Calcula el XP final basado en estrellas obtenidas
     */
    calculateFinalXP(recommendedXP, stars) {
        const xpMultipliers = {
            5: 1.0,    // XP completo
            4: 0.8,    // 80%
            3: 0.6,    // 60%
            2: 0.4,    // 40%
            1: 0.2,    // 20%
            0: 0       // Sin XP
        };

        const multiplier = xpMultipliers[stars] || 0;
        return Math.floor(recommendedXP * multiplier);
    }

    /**
     * CU-014: Paso 18
     * Valida que el XP esté en el rango permitido
     */
    validateXPRange(xpValue) {
        if (xpValue < this.MIN_XP || xpValue > this.MAX_XP) {
            throw new InvalidXPException(
                `XP inválido: ${xpValue}. Debe estar entre ${this.MIN_XP} y ${this.MAX_XP}`
            );
        }
        return true;
    }

    /**
     * CU-014: Paso 20 (manejo de error)
     * Retorna sugerencia cuando XP está fuera de rango
     */
    getSuggestedXPRange(difficulty, mediaType) {
        const baseXP = this.MEDIA_TYPE_XP[mediaType] || 50;
        const multiplier = this.DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
        const suggestedXP = Math.floor(baseXP * multiplier);

        return {
            suggested: suggestedXP,
            min: this.MIN_XP,
            max: this.MAX_XP,
            message: `El sistema sugiere ${suggestedXP} XP para esta configuración`
        };
    }

    /**
     * Procesa el resultado completo del juego
     */
    async processGameCompletion(gameData) {
        try {
            const {
                activityId,
                studentId,
                recommendedXP,
                gameStats
            } = gameData;

            // Paso 7: Calcular rating
            const ratingData = this.calculateStarRating(gameStats);

            // Paso 8: Calcular XP final
            const finalXP = this.calculateFinalXP(recommendedXP, ratingData.stars);

            // Paso 18: Validar XP
            this.validateXPRange(finalXP);

            // Paso 29: Preparar resultado
            const result = {
                activityId,
                studentId,
                recommendedXP,
                finalXP,
                ...ratingData,
                gameStats,
                completedAt: new Date().toISOString()
            };

            return {
                success: true,
                result,
                message: 'Juego completado exitosamente'
            };

        } catch (error) {
            if (error instanceof InvalidXPException) {
                return {
                    success: false,
                    error: error.message,
                    errorType: 'InvalidXPException',
                    code: 422
                };
            }

            return {
                success: false,
                error: error.message,
                code: 500
            };
        }
    }
}

export default new ExperienceService();
export { InvalidXPException };