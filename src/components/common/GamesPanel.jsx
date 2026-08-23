import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from './LoadingState';
import SectionHeader from './SectionHeader';
import { useAlert } from '../../context/AlertContext';
import { useGamesQuery, useGamesInvalidate } from '../../hooks/useGamesQueries';
import {
    QUESTIONNAIRE_TYPES,
    PAIR_TYPES,
    ACTIVITY_CONFIG,
    getGameTypeInfo,
} from '../../config/activityConfig';
import { getDifficultyBadge } from '../../utils/difficultyBadges';

import IconEmptyBox from '../../assets/svgs/empty_box.svg';
import IconWarning from '../../assets/svgs/warning.svg';

// ── Opciones de filtro ────────────────────────────────────────────────────────
const GAME_TYPES = [...QUESTIONNAIRE_TYPES, ...PAIR_TYPES];

const DIFFICULTIES = [
    { value: 'EASY',   label: 'Fácil' },
    { value: 'MEDIUM', label: 'Medio' },
    { value: 'HARD',   label: 'Difícil' },
];

// Estados relativos a un grupo (PK de GameInstance = (groupId, gameId)):
// ASSIGNED = instancia activa · UNASSIGNED = instancia inactiva · NEVER_ASSIGNED = sin instancia.
const ASSIGNMENT_STATUSES = [
    { value: 'ASSIGNED',       label: 'Asignados (activos)' },
    { value: 'UNASSIGNED',     label: 'Asignados (inactivos)' },
    { value: 'NEVER_ASSIGNED', label: 'Nunca asignados' },
];

const SORTS = [
    { value: 'title,asc',       label: 'Título (A-Z)' },
    { value: 'title,desc',      label: 'Título (Z-A)' },
    { value: 'experience,desc', label: 'Más XP' },
    { value: 'experience,asc',  label: 'Menos XP' },
];

const PAGE_SIZES = [12, 24, 48];

const TABS = [
    { id: 'mine', label: 'Mis Actividades', icon: 'person' },
    { id: 'all',  label: 'Todas',           icon: 'public' },
];

const SELECT_CLASS =
    'w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-700 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400 transition-colors';

/**
 * GamesPanel — catálogo de juegos con filtros de servidor (GET /api/games) y paginación.
 * Compartido entre la sección de actividades del admin y los recursos del maestro.
 *
 * @param {string}   props.title
 * @param {string}   props.subtitle
 * @param {string}   props.createRoute      Ruta para crear
 * @param {string}   props.editRoute        Prefijo de ruta para editar (se le añade /{id})
 * @param {string}   props.currentUsername  Creador de la pestaña "Mis Actividades"
 * @param {Function} props.onDelete         async (id) => void
 * @param {Array}    [props.teachers]       Si se pasa, muestra el filtro por maestro (admin)
 * @param {Array}    [props.groups]         Si se pasa, muestra el selector de grupo (admin)
 * @param {number}   [props.fixedGroupId]   Grupo implícito, sin selector (maestro)
 * @param {Array}    [props.instances]      Instancias del grupo del maestro (badges + asignar/activar)
 * @param {Function} [props.onAssign]       async (game) => void — maestro
 * @param {Function} [props.onToggle]       async (gameId, newState) => void — maestro
 * @param {Function} [props.onReloadExtra]  Invalidaciones extra al recargar (p. ej. instancias)
 */
const GamesPanel = ({
    title,
    subtitle,
    createRoute,
    editRoute,
    currentUsername,
    onDelete,
    teachers = null,
    groups = null,
    fixedGroupId = null,
    instances = [],
    onAssign,
    onToggle,
    onReloadExtra,
    showBreadcrumb = false,
}) => {
    const navigate      = useNavigate();
    const { showAlert } = useAlert();

    const [tab,              setTab]              = useState('mine');
    const [gameTypes,        setGameTypes]        = useState([]);
    const [difficult,        setDifficult]        = useState('');
    const [creator,          setCreator]          = useState('');
    const [selectedGroup,    setSelectedGroup]    = useState('');
    const [assignmentStatus, setAssignmentStatus] = useState('');
    const [sort,             setSort]             = useState('title,asc');
    const [size,             setSize]             = useState(12);
    const [page,             setPage]             = useState(0);
    const [deletingId,       setDeletingId]       = useState(null);
    const [assigningId,      setAssigningId]      = useState(null);
    const [togglingId,       setTogglingId]       = useState(null);

    const showGroupSelect   = Array.isArray(groups);
    const showCreatorSelect = Array.isArray(teachers);
    // El maestro filtra por asignación siempre contra su propio grupo; el admin elige uno.
    const groupId           = showGroupSelect ? selectedGroup : (fixedGroupId ?? '');
    const canFilterStatus   = !!groupId;

    // En "Mis Actividades" el creador es el propio usuario; en "Todas", el catálogo completo.
    const effectiveCreator = tab === 'mine' ? (currentUsername || '') : creator;

    const filters = useMemo(() => ({
        gameTypes,
        difficult,
        creator: effectiveCreator,
        // groupId solo aporta como referencia de assignmentStatus, así que van juntos o ninguno.
        groupId:          canFilterStatus && assignmentStatus ? groupId : '',
        assignmentStatus: canFilterStatus ? assignmentStatus : '',
        sort,
        page,
        size,
    }), [gameTypes, difficult, effectiveCreator, groupId, canFilterStatus, assignmentStatus, sort, page, size]);

    const { data, isLoading, isFetching, error } = useGamesQuery(filters);
    const { reloadGames } = useGamesInvalidate();

    const games    = data?.data ?? [];
    const pageInfo = data?.page ?? { number: 0, totalElements: 0, totalPages: 0 };

    const reloadAll = () => {
        reloadGames();
        if (onReloadExtra) onReloadExtra();
    };

    const findInstance = (game) => instances.find(i => i.gameId === game.id || i.game?.id === game.id);

    // ── Cambios de filtro: siempre vuelven a la primera página ────────────────
    const withReset = (setter) => (value) => { setter(value); setPage(0); };

    const changeTab = (id) => {
        setTab(id);
        setCreator('');
        setPage(0);
    };

    const toggleType = (type) => {
        setGameTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
        setPage(0);
    };

    const changeGroup = (value) => {
        setSelectedGroup(value);
        if (!value) setAssignmentStatus(''); // sin grupo no hay estado de asignación
        setPage(0);
    };

    const clearFilters = () => {
        setGameTypes([]);
        setDifficult('');
        setCreator('');
        setSelectedGroup('');
        setAssignmentStatus('');
        setSort('title,asc');
        setPage(0);
    };

    const activeFilters =
        gameTypes.length +
        (difficult ? 1 : 0) +
        (showCreatorSelect && tab === 'all' && creator ? 1 : 0) +
        (showGroupSelect && selectedGroup ? 1 : 0) +
        (canFilterStatus && assignmentStatus ? 1 : 0);

    // ── Acciones ──────────────────────────────────────────────────────────────
    const handleDelete = (id, gameTitle) => {
        showAlert({
            mode: 'alert',
            title: 'Confirmar Eliminación',
            message: `¿Eliminar "${gameTitle}"? Esta acción no se puede deshacer.`,
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: 'Eliminar', type: 'accept', onClick: async () => {
                        setDeletingId(id);
                        try {
                            await onDelete(id);
                            reloadAll();
                            showAlert({ mode: 'success', title: 'Éxito', message: 'Actividad eliminada correctamente.' });
                        } catch (err) {
                            showAlert({ mode: 'error', title: 'Error al eliminar', message: err.message || 'Error desconocido' });
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ],
        });
    };

    const handleAssign = async (game) => {
        setAssigningId(game.id);
        try {
            await onAssign(game);
            reloadAll();
            showAlert({ mode: 'success', title: 'Asignada', message: `"${game.title}" asignada a tu grupo.` });
        } catch (err) {
            const status = err?.status || err?.response?.status;
            if (status === 404)      showAlert({ mode: 'error', title: 'Error', message: 'Juego o grupo no encontrado.' });
            else if (status === 409) showAlert({ mode: 'alert', title: 'Atención', message: 'Este juego ya está asignado o el grupo no te pertenece.' });
            else                     showAlert({ mode: 'error', title: 'Error', message: `Error al asignar: ${err.message || 'Error desconocido'}` });
        } finally {
            setAssigningId(null);
        }
    };

    const handleToggle = async (game, inst) => {
        setTogglingId(game.id);
        try {
            await onToggle(game.id, !inst.isActive);
            reloadAll();
            showAlert({
                mode: 'success',
                title: 'Actualizado',
                message: `Actividad ${inst.isActive ? 'desactivada' : 'activada'} correctamente.`,
            });
        } catch (err) {
            showAlert({ mode: 'error', title: 'Error de actualización', message: err.message || 'No se pudo cambiar el estado.' });
        } finally {
            setTogglingId(null);
        }
    };

    // ── Tarjeta ───────────────────────────────────────────────────────────────
    const renderCard = (game) => {
        const typeInfo  = getGameTypeInfo(game.gameType);
        const diffBadge = getDifficultyBadge(game.difficult);
        const configs   = game.assignActivityGameConfigDTO || [];
        const inst      = findInstance(game);
        const author    = game.teacher
            ? `${game.teacher.firstName ?? game.teacher.firstname ?? ''} ${game.teacher.lastName ?? game.teacher.lastname ?? ''}`.trim()
            : null;

        return (
            <div
                key={game.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
                    inst ? (inst.isActive ? 'border-green-200' : 'border-red-100') : 'border-gray-100'
                }`}
            >
                <div className="h-1.5" style={{ background: typeInfo.color }} />

                <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center p-2 flex-shrink-0"
                            style={{ background: typeInfo.color + '15' }}
                        >
                            {typeInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 leading-tight truncate" title={game.title}>
                                {game.title}
                            </h3>
                            <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block"
                                style={{ background: typeInfo.color + '15', color: typeInfo.color }}
                            >
                                {typeInfo.label}
                            </span>
                        </div>
                        <span
                            className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                            style={{ background: diffBadge.hexColor + '18', color: diffBadge.hexColor }}
                        >
                            {diffBadge.label}
                        </span>
                    </div>

                    {inst && (
                        <span className={`self-start text-[10px] font-bold px-2 py-1 rounded-full mb-3 flex items-center gap-1 ${
                            inst.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            <span className="material-symbols-outlined text-[13px]">
                                {inst.isActive ? 'check_circle' : 'pause_circle'}
                            </span>
                            {inst.isActive ? 'Activa en tu grupo' : 'Inactiva en tu grupo'}
                        </span>
                    )}

                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                        {game.description || 'Sin descripción.'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-amber-500">star</span>
                            {game.experience} XP
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-gray-400">help</span>
                            {game.totalQuestions} {game.gameType === 'FAST_MEMORY' ? 'pares' : 'preguntas'}
                        </span>
                    </div>

                    {configs.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-4">
                            {configs.map((cfg, i) => (
                                <div key={i} className="flex items-center gap-1 text-[10px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                    {cfg.showImage && <span title="Imagen">🖼️</span>}
                                    {cfg.showText  && <span title="Texto">📝</span>}
                                    {cfg.playAudio && <span title="Audio">🔊</span>}
                                    <span className="text-gray-400 ml-0.5 font-semibold">{cfg.isMazahua ? 'MAZ' : 'ESP'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-gray-50">
                        {author && (
                            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[15px]">person</span>
                                {author}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate(`${editRoute}/${game.id}`)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                title="Editar"
                            >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                <span className="hidden sm:inline lg:hidden xl:inline">Editar</span>
                            </button>

                            <button
                                onClick={() => handleDelete(game.id, game.title)}
                                disabled={deletingId === game.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                                title="Eliminar"
                            >
                                <span className={`material-symbols-outlined text-[16px] ${deletingId === game.id ? 'animate-spin' : ''}`}>
                                    {deletingId === game.id ? 'progress_activity' : 'delete'}
                                </span>
                                <span className="hidden sm:inline lg:hidden xl:inline">Eliminar</span>
                            </button>

                            {/* Asignar / activar — solo maestro */}
                            {onAssign && !inst && (
                                <button
                                    onClick={() => handleAssign(game)}
                                    disabled={assigningId === game.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-colors disabled:opacity-50"
                                    title="Asignar"
                                >
                                    <span className={`material-symbols-outlined text-[16px] ${assigningId === game.id ? 'animate-spin' : ''}`}>
                                        {assigningId === game.id ? 'progress_activity' : 'group_add'}
                                    </span>
                                    <span className="hidden sm:inline lg:hidden xl:inline">Asignar</span>
                                </button>
                            )}

                            {onToggle && inst && (
                                <button
                                    onClick={() => handleToggle(game, inst)}
                                    disabled={togglingId === game.id}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                                        inst.isActive
                                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                                    }`}
                                    title={inst.isActive ? 'Desactivar' : 'Activar'}
                                >
                                    <span className={`material-symbols-outlined text-[16px] ${togglingId === game.id ? 'animate-spin' : ''}`}>
                                        {togglingId === game.id
                                            ? 'progress_activity'
                                            : (inst.isActive ? 'block' : 'check_circle')}
                                    </span>
                                    <span className="hidden sm:inline lg:hidden xl:inline">
                                        {inst.isActive ? 'Desactivar' : 'Activar'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ── Contenido ─────────────────────────────────────────────────────────────
    const renderContent = () => {
        if (isLoading) return <LoadingState message="Cargando actividades..." />;

        if (error) return (
            <div className="text-center py-16 bg-white rounded-2xl border border-red-100">
                <img src={IconWarning} alt="Error" className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-600 mb-2">Error al cargar</h3>
                <p className="text-gray-500 text-sm mb-6">{error.message}</p>
                <button
                    onClick={reloadAll}
                    className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                    Reintentar
                </button>
            </div>
        );

        if (games.length === 0) return (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <img src={IconEmptyBox} alt="Vacío" className="w-20 h-20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {activeFilters > 0 ? 'Sin resultados' : 'Aún no hay actividades'}
                </h3>
                <p className="text-gray-500 mb-6">
                    {activeFilters > 0
                        ? 'Ningún juego coincide con los filtros seleccionados.'
                        : tab === 'mine'
                            ? 'Crea tu primera actividad o revisa la pestaña "Todas".'
                            : 'Todavía no hay actividades creadas en la plataforma.'}
                </p>
                {activeFilters > 0 ? (
                    <button
                        onClick={clearFilters}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Limpiar filtros
                    </button>
                ) : (
                    <button
                        onClick={() => navigate(createRoute)}
                        className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Crear Actividad
                    </button>
                )}
            </div>
        );

        return (
            <>
                <section className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                    {games.map(renderCard)}
                </section>

                {pageInfo.totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 mt-8 bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex-wrap">
                        <p className="text-sm text-gray-500">
                            Página <span className="font-semibold text-gray-700">{pageInfo.number + 1}</span> de{' '}
                            <span className="font-semibold text-gray-700">{pageInfo.totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={pageInfo.number === 0 || isFetching}
                                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={pageInfo.number + 1 >= pageInfo.totalPages || isFetching}
                                className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                            >
                                Siguiente
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full">
            <SectionHeader
                title={title}
                subtitle={subtitle}
                showBreadcrumb={showBreadcrumb}
                onReload={reloadAll}
                actionButton={
                    <button
                        onClick={() => navigate(createRoute)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E65100] to-[#FF8F00] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        <span className="hidden sm:inline">Crear Nuevo</span>
                    </button>
                }
            />

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => changeTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            tab === t.id
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Panel de filtros */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">tune</span>
                        <h2 className="font-bold text-gray-700">Filtros</h2>
                        {activeFilters > 0 && (
                            <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {activeFilters}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            <span className="font-bold text-gray-800">{pageInfo.totalElements}</span> resultado{pageInfo.totalElements === 1 ? '' : 's'}
                        </span>
                        {activeFilters > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Chips de tipo de juego (repetibles → OR en el backend) */}
                <div className="flex gap-2 flex-wrap mb-4">
                    <button
                        onClick={() => { setGameTypes([]); setPage(0); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            gameTypes.length === 0
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        Todos los tipos
                    </button>
                    {GAME_TYPES.map(type => {
                        const selected = gameTypes.includes(type);
                        const color    = ACTIVITY_CONFIG[type]?.color || '#6b7280';
                        return (
                            <button
                                key={type}
                                onClick={() => toggleType(type)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                                style={selected
                                    ? { background: color, borderColor: color, color: '#fff' }
                                    : { background: '#fff', borderColor: '#e5e7eb', color: '#4b5563' }}
                            >
                                {ACTIVITY_CONFIG[type]?.label ?? type}
                            </button>
                        );
                    })}
                </div>

                {/* Selects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Dificultad</span>
                        <select
                            value={difficult}
                            onChange={(e) => withReset(setDifficult)(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            <option value="">Todas</option>
                            {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </label>

                    {showCreatorSelect && tab === 'all' && (
                        <label className="block">
                            <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Maestro</span>
                            <select
                                value={creator}
                                onChange={(e) => withReset(setCreator)(e.target.value)}
                                className={SELECT_CLASS}
                            >
                                <option value="">Todos los maestros</option>
                                {teachers.map(t => (
                                    <option key={t.username} value={t.username}>
                                        {t.firstname} {t.lastname}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    {showGroupSelect && (
                        <label className="block">
                            <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Grupo</span>
                            <select
                                value={selectedGroup}
                                onChange={(e) => changeGroup(e.target.value)}
                                className={SELECT_CLASS}
                            >
                                <option value="">Todos los grupos</option>
                                {groups.map(g => (
                                    <option key={g.grade} value={g.grade}>{g.grade}º Grado</option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 mb-1.5 block">
                            Estado de asignación
                            {!canFilterStatus && (
                                <span className="text-gray-300 font-normal">
                                    {showGroupSelect ? ' · requiere grupo' : ' · sin grupo asignado'}
                                </span>
                            )}
                        </span>
                        <select
                            value={assignmentStatus}
                            onChange={(e) => withReset(setAssignmentStatus)(e.target.value)}
                            disabled={!canFilterStatus}
                            className={SELECT_CLASS}
                        >
                            <option value="">Cualquiera</option>
                            {ASSIGNMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </label>

                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Orden</span>
                        <select
                            value={sort}
                            onChange={(e) => withReset(setSort)(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </label>

                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Por página</span>
                        <select
                            value={size}
                            onChange={(e) => withReset(setSize)(Number(e.target.value))}
                            className={SELECT_CLASS}
                        >
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default GamesPanel;
