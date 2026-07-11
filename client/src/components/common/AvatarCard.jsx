import React from 'react';
import { getAvatarUrl } from '../../config/avatars';

// Los avatares son ilustraciones de cuerpo completo sobre lienzo cuadrado y con
// la misma composición: la cara cae siempre alrededor del 48% horizontal y el 26%
// vertical. Al ampliar desde ese punto (transform-origin) el recorte circular
// queda centrado en la cara sin deformar la imagen.
const FACE_ORIGIN = '48% 26%';
const FACE_ZOOM   = 2.1;

const SIZES = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
};

/**
 * Avatar circular recortado a la cara del personaje.
 *
 * Props:
 *  - avatarId: number — 0..19; fuera de rango cae en el primero
 *  - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl', o un número de píxeles (default 'sm')
 *  - alt: string
 *  - ring: boolean — borde blanco + sombra (default true)
 *  - zoom: number — factor de acercamiento a la cara (default 2.1)
 *  - className: string — clases extra para el contenedor
 */
const AvatarCard = ({
    avatarId,
    size = 'sm',
    alt = '',
    ring = true,
    zoom = FACE_ZOOM,
    className = '',
}) => {
    const isPx = typeof size === 'number';

    return (
        <div
            className={`${isPx ? '' : (SIZES[size] || SIZES.sm)} rounded-full overflow-hidden bg-white flex-shrink-0 ${
                ring ? 'border-2 border-white shadow-sm' : ''
            } ${className}`}
            style={isPx ? { width: size, height: size } : undefined}
        >
            <img
                src={getAvatarUrl(avatarId)}
                alt={alt}
                className="w-full h-full object-cover select-none"
                style={{ transform: `scale(${zoom})`, transformOrigin: FACE_ORIGIN }}
                draggable={false}
            />
        </div>
    );
};

export default AvatarCard;
