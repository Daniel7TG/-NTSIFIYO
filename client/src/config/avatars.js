// client/src/config/avatars.js
// Mapeo de avatares: el backend guarda `avatarId` 0..19; los archivos se llaman
// avatar_1..avatar_20 (1-indexados). avatarId N ⇄ avatar_{N + 1}.
// Los .webp viven en assets y los empaqueta el bundler (no salen de un bucket).

import avatar1  from '../assets/avatars/avatar_1.webp';
import avatar2  from '../assets/avatars/avatar_2.webp';
import avatar3  from '../assets/avatars/avatar_3.webp';
import avatar4  from '../assets/avatars/avatar_4.webp';
import avatar5  from '../assets/avatars/avatar_5.webp';
import avatar6  from '../assets/avatars/avatar_6.webp';
import avatar7  from '../assets/avatars/avatar_7.webp';
import avatar8  from '../assets/avatars/avatar_8.webp';
import avatar9  from '../assets/avatars/avatar_9.webp';
import avatar10 from '../assets/avatars/avatar_10.webp';
import avatar11 from '../assets/avatars/avatar_11.webp';
import avatar12 from '../assets/avatars/avatar_12.webp';
import avatar13 from '../assets/avatars/avatar_13.webp';
import avatar14 from '../assets/avatars/avatar_14.webp';
import avatar15 from '../assets/avatars/avatar_15.webp';
import avatar16 from '../assets/avatars/avatar_16.webp';
import avatar17 from '../assets/avatars/avatar_17.webp';
import avatar18 from '../assets/avatars/avatar_18.webp';
import avatar19 from '../assets/avatars/avatar_19.webp';
import avatar20 from '../assets/avatars/avatar_20.webp';

/** Índice por avatarId (0-indexado): AVATAR_IMAGES[0] === avatar_1.webp */
export const AVATAR_IMAGES = [
    avatar1,  avatar2,  avatar3,  avatar4,  avatar5,
    avatar6,  avatar7,  avatar8,  avatar9,  avatar10,
    avatar11, avatar12, avatar13, avatar14, avatar15,
    avatar16, avatar17, avatar18, avatar19, avatar20,
];

/** Cantidad de avatares: avatar_1 … avatar_20 ⇄ avatarId 0 … 19. */
export const AVATAR_COUNT = AVATAR_IMAGES.length;

/** avatarId (0-indexado) → nombre del archivo sin extensión ("avatar_1"…"avatar_20"). */
export const avatarIdToName = (avatarId) => `avatar_${Number(avatarId) + 1}`;

/** nombre ("avatar_1"…"avatar_20") → avatarId (0-indexado). */
export const avatarNameToId = (name) => Number(String(name).replace('avatar_', '')) - 1;

/** ¿El id cae dentro del catálogo? */
export const isValidAvatarId = (avatarId) =>
    Number.isInteger(Number(avatarId)) && Number(avatarId) >= 0 && Number(avatarId) < AVATAR_COUNT;

/** avatarId (0-indexado) → imagen empaquetada. Fuera de rango cae en el primero. */
export const getAvatarUrl = (avatarId) =>
    AVATAR_IMAGES[isValidAvatarId(avatarId) ? Number(avatarId) : 0];

/**
 * Catálogo completo, listo para pintar un selector.
 * [{ avatarId: 0, name: 'avatar_1', url: <import> }, …]
 */
export const AVATARS = AVATAR_IMAGES.map((url, avatarId) => ({
    avatarId,
    name: avatarIdToName(avatarId),
    url,
}));

export default AVATARS;
