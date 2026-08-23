import Roles from '../utils/roles';
import { getNavigationRoutes } from './activityConfig';

/**
 * Configuración centralizada de navegación.
 * Cada sección del sidebar se define aquí con sus rutas,
 * iconos, etiquetas, y los roles que tienen acceso.
 *
 * Propiedades de cada item:
 *   id       – identificador único
 *   label    – texto visible en el menú
 *   path     – ruta del componente
 *   icon     – nombre del ícono de Material Symbols
 *   roles    – array de Roles que pueden ver este item
 *   children – (opcional) sub-rutas anidadas
 */

// ─── Navegación del panel Estudiante ──────────────────────────
export const studentNavigation = [
    { id: 'dashboard', label: 'Dashboard', path: '/estudiante/dashboard', icon: 'dashboard', roles: [Roles.STUDENT] },
    { id: 'map', label: 'Mapa', path: '/estudiante/mapa', icon: 'map', roles: [Roles.STUDENT] },
    { id: 'assignments', label: 'Asignaciones', path: '/estudiante/asignaciones', icon: 'assignment', roles: [Roles.STUDENT] },
    { id: 'activities', label: 'Actividades', path: '/estudiante/actividades', icon: 'sports_esports', roles: [Roles.STUDENT] },
    { id: 'content', label: 'Contenido', path: '/estudiante/contenido', icon: 'article', roles: [Roles.STUDENT] },
    { id: 'dictionary', label: 'Diccionario', path: '/estudiante/diccionario', icon: 'translate', roles: [Roles.STUDENT] },
    { id: 'pronunciation', label: 'Pronunciación', path: '/estudiante/pronunciacion', icon: 'record_voice_over', roles: [Roles.STUDENT] },
];

// ─── Navegación del panel Visitante ───────────────────────────
export const visitorNavigation = [
    { id: 'dashboard', label: 'Dashboard', path: '/visitante/dashboard', icon: 'dashboard', roles: [Roles.VISITOR] },
    { id: 'map', label: 'Mapa', path: '/visitante/mapa', icon: 'map', roles: [Roles.VISITOR] },
    { id: 'activities', label: 'Actividades', path: '/visitante/actividades', icon: 'sports_esports', roles: [Roles.VISITOR] },
    { id: 'content', label: 'Contenido', path: '/visitante/contenido', icon: 'article', roles: [Roles.VISITOR] },
    { id: 'dictionary', label: 'Diccionario', path: '/visitante/diccionario', icon: 'translate', roles: [Roles.VISITOR] },
    { id: 'pronunciation', label: 'Pronunciación', path: '/visitante/pronunciacion', icon: 'record_voice_over', roles: [Roles.VISITOR] },
];

// ─── Navegación del panel Maestro ─────────────────────────────
export const teacherNavigation = [
    { id: 'dashboard', label: 'Dashboard', path: '/maestro/dashboard', icon: 'dashboard', roles: [Roles.TEACHER] },
    { id: 'students', label: 'Estudiantes', path: '/maestro/estudiantes', icon: 'school', roles: [Roles.TEACHER] },
    { id: 'resources', label: 'Recursos', path: '/maestro/recursos', icon: 'library_books', roles: [Roles.TEACHER] },
    { id: 'content', label: 'Contenido', path: '/maestro/contenido', icon: 'article', roles: [Roles.TEACHER] },
    { id: 'dictionary', label: 'Diccionario', path: '/maestro/diccionario', icon: 'translate', roles: [Roles.TEACHER] },
    { id: 'pronunciation', label: 'Pronunciación', path: '/maestro/pronunciacion', icon: 'record_voice_over', roles: [Roles.TEACHER] },
    { id: 'assignments', label: 'Asignaciones', path: '/maestro/asignaciones', icon: 'assignment', roles: [Roles.TEACHER] },
];

// ─── Navegación del panel Administrador ───────────────────────
export const adminNavigation = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard', roles: [Roles.ADMIN] },
    { id: 'groups', label: 'Grupos', path: '/admin/grupos', icon: 'groups', roles: [Roles.ADMIN] },
    { id: 'students', label: 'Estudiantes', path: '/admin/estudiantes', icon: 'school', roles: [Roles.ADMIN] },
    { id: 'teachers', label: 'Maestros', path: '/admin/maestros', icon: 'person', roles: [Roles.ADMIN] },
    { id: 'dictionary', label: 'Diccionario', path: '/admin/palabras', icon: 'library_books', roles: [Roles.ADMIN] },
    { id: 'activities', label: 'Actividades', path: '/admin/actividades', icon: 'extension', roles: [Roles.ADMIN] },
    { id: 'content', label: 'Contenido', path: '/admin/contenido', icon: 'article', roles: [Roles.ADMIN] },
];

// ─── Rutas públicas (sin autenticación) ───────────────────────
export const publicRoutes = [
    { id: 'home', label: 'Inicio', path: '/', icon: 'home', roles: [Roles.ADMIN, Roles.STUDENT, Roles.TEACHER, Roles.VISITOR] },
    { id: 'auth', label: 'Ingresar', path: '/auth', icon: 'login', roles: [Roles.ADMIN, Roles.STUDENT, Roles.TEACHER, Roles.VISITOR] },
    { id: 'register', label: 'Registro', path: '/registro', icon: 'person_add', roles: [Roles.ADMIN, Roles.STUDENT, Roles.TEACHER, Roles.VISITOR] },
];

// ─── Rutas de juegos (compartidas) ────────────────────────────
export const gameRoutes = getNavigationRoutes();

// ─── Rutas del maestro (crear/editar recursos) ────────────────
export const teacherResourceRoutes = [
    { id: 'create-resource', label: 'Crear Recurso', path: '/maestro/recursos/crear', icon: 'add_circle', roles: [Roles.TEACHER] },
    { id: 'edit-resource', label: 'Editar Recurso', path: '/maestro/recursos/editar/:editId', icon: 'edit', roles: [Roles.TEACHER] },
];

// ─── Rutas de admin (crear/editar actividades) ───────────────
export const adminResourceRoutes = [
    { id: 'admin-create-activity', label: 'Crear Actividad', path: '/admin/actividades/crear', icon: 'add_circle', roles: [Roles.ADMIN] },
    { id: 'admin-edit-activity', label: 'Editar Actividad', path: '/admin/actividades/editar/:editId', icon: 'edit', roles: [Roles.ADMIN] },
    { id: 'admin-create-media', label: 'Crear Contenido', path: '/admin/contenido/crear', icon: 'add_circle', roles: [Roles.ADMIN] },
];

// ─── Ruta de admin login ──────────────────────────────────────
export const adminAuthRoute = {
    id: 'admin-login', label: 'Admin Login', path: '/admin', icon: 'shield_person', roles: [Roles.ADMIN],
};

// ─── Configuración del sidebar por rol ────────────────────────
export const sidebarConfig = {
    [Roles.ADMIN]: {
        menuItems: adminNavigation,
        roleLabel: 'Administrador',
        accentColor: 'primary',
        homePath: '/admin/dashboard',
    },
    [Roles.TEACHER]: {
        menuItems: teacherNavigation,
        roleLabel: 'Maestro',
        accentColor: 'green',
        homePath: '/maestro/dashboard',
    },
    [Roles.STUDENT]: {
        menuItems: studentNavigation,
        roleLabel: 'Estudiante',
        accentColor: 'amber',
        homePath: '/estudiante/dashboard',
    },
    [Roles.VISITOR]: {
        menuItems: visitorNavigation,
        roleLabel: 'Visitante',
        accentColor: 'primary',
        homePath: '/visitante/dashboard',
    },
};

export default sidebarConfig;
