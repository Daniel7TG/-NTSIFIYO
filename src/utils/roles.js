/**
 * Enum de roles de usuario.
 * Fuente única de verdad para los roles del sistema.
 * 
 * Uso:
 *   import { Roles } from '../utils/roles';
 *   if (user.role === Roles.ADMIN) { ... }
 */
const Roles = Object.freeze({
    ADMIN: 'ADMIN',
    STUDENT: 'STUDENT',
    TEACHER: 'TEACHER',
    VISITOR: 'VISITOR',
});

export default Roles;
