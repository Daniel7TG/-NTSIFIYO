/**
 * Utilidades de color para el estilo "kid-card" 3D.
 *
 * El efecto del dashboard usa tres tonos del mismo color:
 *   relleno (brillante) → borde (más oscuro) → sombra inferior (aún más oscura)
 * Estas funciones derivan esos tonos a partir de un color base.
 */

function parseHex(hex) {
    let h = (hex || '#000000').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    return {
        r: (num >> 16) & 0xff,
        g: (num >> 8) & 0xff,
        b: num & 0xff,
    };
}

function toHex({ r, g, b }) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}

/** Oscurece un color hex mezclándolo hacia el negro. `amount` 0–1. */
export function darken(hex, amount = 0.2) {
    const { r, g, b } = parseHex(hex);
    return toHex({ r: r * (1 - amount), g: g * (1 - amount), b: b * (1 - amount) });
}

/** Aclara un color hex mezclándolo hacia el blanco. `amount` 0–1. */
export function lighten(hex, amount = 0.2) {
    const { r, g, b } = parseHex(hex);
    return toHex({
        r: r + (255 - r) * amount,
        g: g + (255 - g) * amount,
        b: b + (255 - b) * amount,
    });
}

/**
 * Devuelve la terna de tonos del estilo 3D para BOTONES a partir de un color base.
 *   fill   → relleno brillante (color base)
 *   border → borde intermedio
 *   shadow → sombra inferior oscura
 */
export function get3DShades(hex) {
    return {
        fill: hex,
        border: darken(hex, 0.15),
        shadow: darken(hex, 0.32),
    };
}
