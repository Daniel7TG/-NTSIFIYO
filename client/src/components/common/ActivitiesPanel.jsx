import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from './LoadingState';
import { useAlert } from '../../context/AlertContext';
import { QUESTIONNAIRE_TYPES, PAIR_TYPES, ACTIVITY_CONFIG, getGameTypeInfo } from '../../config/activityConfig';
import { getDifficultyBadge } from '../../utils/difficultyBadges';
import SectionHeader from './SectionHeader';

import IconQuiz from '../../assets/svgs/juegos/quiz_premium.svg';
// import IconFastMemory from '../assets/svgs/juegos/memoria_rapida_premium.svg';
// import IconIntruder from '../assets/svgs/juegos/intruso_premium.svg';
// import IconPuzzle from '../assets/svgs/juegos/rompecabezas_premium.svg';
import IconMemory from '../../assets/svgs/juegos/memorama_premium.svg';
// import IconLottery from '../assets/svgs/juegos/loteria_premium.svg';
// import IconMaze from '../assets/svgs/juegos/laberinto_premium.svg';
// import IconFindWord from '../assets/svgs/juegos/buscar_premium.svg';
// import IconPairs from '../assets/svgs/juegos/pares_premium.svg';

import IconSuccess from '../../assets/svgs/success_game.svg';
import IconInactive from '../../assets/svgs/inactive.svg';
import IconWarning from '../../assets/svgs/warning.svg';
import IconEmptyBox from '../../assets/svgs/empty_box.svg';
import IconConstruction from '../../assets/svgs/construction.svg';

// ── Filter options built from activityTypes enums ──
// QUESTIONNAIRE_TYPES y PAIR_TYPES son arrays de strings (ActivityTypes values).
// Se mapea cada string a su config en ACTIVITY_CONFIG para obtener value y label.
const ALL_ACTIVITY_TYPES = [...QUESTIONNAIRE_TYPES, ...PAIR_TYPES];
const GAME_TYPE_FILTERS = [
    { value: 'ALL', label: 'Todos' },
    ...ALL_ACTIVITY_TYPES.map(t => ({ value: t, label: ACTIVITY_CONFIG[t]?.label ?? t })),
];

const TABS = [
    { id: 'mine', label: 'Mis Actividades', icon: 'person' },
    { id: 'all',  label: 'Todas las Actividades', icon: 'public' },
];

/**
 * ActivitiesPanel — componente compartido entre teacher y admin.
 *
 * @param {object}   props
 * @param {Array}    props.activities        Lista de actividades
 * @param {Array}    props.instances         Instancias del maestro ([] para admin)
 * @param {Array}    props.allGames          Lista de todos los juegos disponibles
 * @param {boolean}  props.loading
 * @param {boolean}  props.loadingAllGames
 * @param {string}   props.error
 * @param {Function} props.onReload          Invalida la query y recarga
 * @param {Function} props.onDeleteActivity  async (id) => void — sin confirmación, el panel la maneja
 * @param {Function} [props.onAssignActivity]  async (activity) => void — solo teacher
 * @param {Function} [props.onToggleInstance]  async (activityId, newState) => void — solo teacher
 * @param {string}   props.editRoute         Prefijo de ruta para editar, ej. '/maestro/recursos/editar'
 * @param {string}   props.createRoute       Ruta para crear nueva actividad
 * @param {string}   props.title
 * @param {string}   props.subtitle
 * @param {boolean}  [props.showTabs]        Mostrar tabs Mine/All (teacher)
 */
const ActivitiesPanel = ({
    activities = [],
    instances  = [],
    allGames   = [],
    loading    = false,
    loadingAllGames = false,
    error      = '',
    onReload,
    onDeleteActivity,
    onAssignActivity,
    onToggleInstance,
    editRoute,
    createRoute,
    title,
    subtitle,
    showTabs = false,
}) => {
    const navigate   = useNavigate();
    const { showAlert } = useAlert();

    const [activeTab,   setActiveTab]   = useState('mine');
    const [filterType,  setFilterType]  = useState('ALL');
    const [deletingId,  setDeletingId]  = useState(null);
    const [assigningId, setAssigningId] = useState(null);
    const [togglingId,  setTogglingId]  = useState(null);
    const [assigningAllId, setAssigningAllId] = useState(null);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleDelete = (id, actTitle) => {
        showAlert({
            mode: 'alert',
            title: 'Confirmar Eliminación',
            message: `¿Eliminar "${actTitle}"? Esta acción no se puede deshacer.`,
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: 'Eliminar', type: 'accept', onClick: async () => {
                        setDeletingId(id);
                        try {
                            await onDeleteActivity(id);
                            onReload();
                            showAlert({ mode: 'success', title: 'Éxito', message: 'Actividad eliminada correctamente.' });
                        } catch (err) {
                            showAlert({
                                mode: 'error',
                                title: 'Error al eliminar',
                                message: err.message || 'Error desconocido',
                            });
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ],
        });
    };

    const handleAssign = async (activity) => {
        if (!onAssignActivity) return;
        setAssigningId(activity.id);
        try {
            await onAssignActivity(activity);
            onReload();
            showAlert({ mode: 'success', title: 'Asignada', message: `"${activity.title}" asignada al grupo exitosamente.` });
        } catch (err) {
            const status = err?.status || err?.response?.status;
            if (status === 404)       showAlert({ mode: 'error', title: 'Error', message: 'Juego o grupo no encontrado.' });
            else if (status === 409)  showAlert({ mode: 'alert', title: 'Atención', message: 'Este juego ya está asignado o el grupo no te pertenece.' });
            else                      showAlert({ mode: 'error', title: 'Error', message: `Error al asignar: ${err.message || 'Error desconocido'}` });
        } finally {
            setAssigningId(null);
        }
    };

    const handleToggle = async (activityId, inst) => {
        if (!onToggleInstance) return;
        setTogglingId(activityId);
        try {
            await onToggleInstance(activityId, !inst.isActive);
            onReload();
            showAlert({ mode: 'success', title: 'Actualizado', message: `Actividad ${inst.isActive ? 'desactivada' : 'activada'} correctamente.` });
        } catch (err) {
            showAlert({
                mode: 'error',
                title: 'Error de actualización',
                message: err.message || 'No se pudo cambiar el estado.',
            });
        } finally {
            setTogglingId(null);
        }
    };

    const handleAssignFromAll = async (game) => {
        if (!onAssignActivity) return;
        setAssigningAllId(game.id);
        try {
            await onAssignActivity(game);
            onReload();
            showAlert({ mode: 'success', title: 'Asignada', message: `"${game.title}" asignada al grupo exitosamente.` });
        } catch (err) {
            const status = err?.status || err?.response?.status;
            if (status === 404)       showAlert({ mode: 'error', title: 'Error', message: 'Juego o grupo no encontrado.' });
            else if (status === 409)  showAlert({ mode: 'alert', title: 'Atención', message: 'Este juego ya está asignado o el grupo no te pertenece.' });
            else                      showAlert({ mode: 'error', title: 'Error', message: `Error al asignar: ${err.message || 'Error desconocido'}` });
        } finally {
            setAssigningAllId(null);
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    const quizValues    = new Set(QUESTIONNAIRE_TYPES);
    const pairValues    = new Set(PAIR_TYPES);
    const quizCount     = activities.filter(a => quizValues.has(a.gameType)).length;
    const pairsCount    = activities.filter(a => pairValues.has(a.gameType)).length;
    const assignedCount = instances.filter(i => i.isActive).length;
    const pausedCount   = instances.filter(i => !i.isActive).length;
    const hasInstances  = !!onToggleInstance;

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filteredActivities = activities.filter(
        a => filterType === 'ALL' || a.gameType === filterType
    );

    const filteredAllGames = allGames.filter(
        g => filterType === 'ALL' || g.gameType === filterType
    );

    const findInst = (a) => instances.find(i => i.gameId === a.id || i.game?.id === a.id);

    const activeActivities   = hasInstances
        ? filteredActivities.filter(a => { const i = findInst(a); return i && i.isActive; })
        : [];
    const inactiveActivities = hasInstances
        ? filteredActivities.filter(a => { const i = findInst(a); return i && !i.isActive; })
        : [];

    // ── Card ──────────────────────────────────────────────────────────────────
    const renderCard = (activity, extraClasses = '') => {
        const typeInfo      = getGameTypeInfo(activity.gameType);
        const diffBadge     = getDifficultyBadge(activity.difficult);
        const configSummary = activity.assignActivityGameConfigDTO || [];
        const inst          = findInst(activity);

        return (
            <div
                key={activity.id}
                className={`bg-white rounded-2xl border ${
                    inst
                        ? (inst.isActive ? 'border-green-200 shadow-green-100' : 'border-red-100 shadow-red-50')
                        : 'border-gray-100'
                } shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col ${extraClasses}`}
            >
                <div className="h-2" style={{ background: typeInfo.color }} />

                <div className="p-5 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background: typeInfo.color + '15' }}
                        >
                            {typeInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 leading-tight truncate">{activity.title}</h3>
                            <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block"
                                style={{ background: typeInfo.color + '15', color: typeInfo.color }}
                            >
                                {typeInfo.label}
                            </span>
                        </div>
                        {inst && (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center ${inst.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {inst.isActive ? (
                                    <><img src={IconSuccess} alt="Activa" className="inline w-3 h-3 mr-1" /> Activa</>
                                ) : (
                                    <><img src={IconInactive} alt="Inactiva" className="inline w-3 h-3 mr-1" /> Inactiva</>
                                )}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{activity.description}</p>

                    {/* Teacher info */}
                    {activity.teacher && (
                        <p className="text-xs text-gray-400 mb-3">
                            👤 {activity.teacher.firstName} {activity.teacher.lastName}
                        </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span style={{ color: diffBadge.hexColor, fontWeight: 600 }}>
                            {diffBadge.dot} {diffBadge.label}
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span>⭐ {activity.experience} XP</span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span>
                            📝 {activity.totalQuestions}{' '}
                            {activity.gameType === 'FAST_MEMORY' ? 'pares' : 'preguntas'}
                        </span>
                    </div>

                    {/* Config badges */}
                    {configSummary.length > 0 && (
                        <div className="flex gap-2 mb-4 flex-wrap mt-auto">
                            {configSummary.map((cfg, i) => (
                                <div key={i} className="flex gap-1 text-[10px] bg-gray-50 rounded-lg px-2 py-1">
                                    {cfg.showImage && <span title="Imagen">🖼️</span>}
                                    {cfg.showText  && <span title="Texto">📝</span>}
                                    {cfg.playAudio && <span title="Audio">🔊</span>}
                                    <span className="text-gray-400 ml-1">{cfg.isMazahua ? 'MAZ' : 'ESP'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 mt-auto">
                        <button
                            onClick={() => navigate(`${editRoute}/${activity.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                            title="Editar"
                        >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            <span className="hidden sm:inline lg:hidden xl:inline">Editar</span>
                        </button>

                        <button
                            onClick={() => handleDelete(activity.id, activity.title)}
                            disabled={deletingId === activity.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                            title="Eliminar"
                        >
                            {deletingId === activity.id
                                ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                : <span className="material-symbols-outlined text-[16px]">delete</span>
                            }
                            <span className="hidden sm:inline lg:hidden xl:inline">Eliminar</span>
                        </button>

                        {/* Assign / Toggle — solo para teacher */}
                        {onAssignActivity && (
                            !inst ? (
                                <button
                                    onClick={() => handleAssign(activity)}
                                    disabled={assigningId === activity.id}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-colors disabled:opacity-50"
                                    title="Asignar"
                                >
                                    {assigningId === activity.id
                                        ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        : <span className="material-symbols-outlined text-[16px]">group_add</span>
                                    }
                                    <span className="hidden sm:inline lg:hidden xl:inline">Asignar</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleToggle(activity.id, inst)}
                                    disabled={togglingId === activity.id}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                                        inst.isActive
                                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                                    }`}
                                    title={inst.isActive ? 'Desactivar' : 'Activar'}
                                >
                                    {togglingId === activity.id
                                        ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        : <span className="material-symbols-outlined text-[16px]">
                                            {inst.isActive ? 'block' : 'check_circle'}
                                        </span>
                                    }
                                    <span className="hidden sm:inline lg:hidden xl:inline">
                                        {inst.isActive ? 'Desactivar' : 'Activar'}
                                    </span>
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ── Content area ──────────────────────────────────────────────────────────
    const renderContent = () => {
        if (loading) return <LoadingState message="Cargando actividades..." />;

        if (error) return (
            <div className="text-center py-16 bg-white rounded-2xl border border-red-100">
                <img src={IconWarning} alt="Error" className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-600 mb-2">Error al cargar</h3>
                <p className="text-gray-500 text-sm mb-6">{error}</p>
                <button
                    onClick={onReload}
                    className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );

        if (filteredActivities.length === 0) return (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <img src={IconEmptyBox} alt="Vacío" className="w-20 h-20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {filterType !== 'ALL' ? 'Sin resultados' : 'Aún no hay actividades'}
                </h3>
                <p className="text-gray-500 mb-6">
                    {filterType !== 'ALL'
                        ? 'Intenta con otro filtro.'
                        : 'Crea la primera actividad para comenzar.'}
                </p>
                {filterType === 'ALL' && (
                    <button
                        onClick={() => navigate(createRoute)}
                        className="px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
                    >
                        🚀 Crear Primera Actividad
                    </button>
                )}
            </div>
        );

        return (
            <div className="flex flex-col gap-8 w-full">
                {/* Activas (teacher con instancias) */}
                {activeActivities.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            🟢 Actividades Activas
                        </h3>
                        <div className="flex gap-6 overflow-x-auto pb-6 snap-x" style={{ scrollSnapType: 'x mandatory' }}>
                            {activeActivities.map(a => renderCard(a, 'min-w-[320px] max-w-[360px] snap-start shrink-0'))}
                        </div>
                    </div>
                )}

                {/* Inactivas (teacher con instancias) */}
                {inactiveActivities.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            🔴 Actividades Inactivas
                        </h3>
                        <div className="flex gap-6 overflow-x-auto pb-6 snap-x" style={{ scrollSnapType: 'x mandatory' }}>
                            {inactiveActivities.map(a => renderCard(a, 'min-w-[320px] max-w-[360px] snap-start shrink-0'))}
                        </div>
                    </div>
                )}

                {/* Grid completo */}
                <div>
                    {(activeActivities.length > 0 || inactiveActivities.length > 0) && (
                        <h3 className="text-xl font-bold text-gray-800 mb-4 mt-4">🎮 Todas las Actividades</h3>
                    )}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredActivities.map(a => renderCard(a))}

                        {/* Create card */}
                        <div
                            onClick={() => navigate(createRoute)}
                            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center min-h-[280px] hover:border-green-400 hover:bg-green-50/30 transition-all cursor-pointer"
                        >
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-gray-400 text-3xl">add</span>
                            </div>
                            <h3 className="font-semibold text-green-600 text-lg mb-1">Crear Nueva Actividad</h3>
                            <p className="text-sm text-gray-500 text-center">Diseña juegos y cuestionarios</p>
                        </div>
                    </section>
                </div>
            </div>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full bg-gray-50 flex-1 min-h-full">
            <div className="w-full">
                <div className="max-w-6xl mx-auto p-8">

                    <SectionHeader 
                        title={title} 
                        subtitle={subtitle} 
                        onReload={onReload}
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

                    {/* Tabs — solo teacher */}
                    {showTabs && (
                        <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-green-500 text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Tab "all" — all available games */}
                    {showTabs && activeTab === 'all' ? (
                        <div>
                            {loadingAllGames ? (
                                <LoadingState message="Cargando todas las actividades..." />
                            ) : filteredAllGames.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                    <img src={IconEmptyBox} alt="Vacío" className="w-20 h-20 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {filterType !== 'ALL' ? 'Sin resultados' : 'No hay actividades disponibles'}
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        {filterType !== 'ALL'
                                            ? 'Intenta con otro filtro.'
                                            : 'Aún no hay actividades creadas por otros maestros.'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">🌐 Todas las Actividades Disponibles</h3>
                                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredAllGames.map(game => {
                                            const typeInfo = getGameTypeInfo(game.gameType);
                                            const diffBadge = getDifficultyBadge(game.difficult);
                                            const configSummary = game.assignActivityGameConfigDTO || [];
                                            const inst = instances.find(i => i.game?.id === game.id || i.gameId === game.id);

                                            return (
                                                <div
                                                    key={game.id}
                                                    className={`bg-white rounded-2xl border ${
                                                        inst
                                                            ? (inst.isActive ? 'border-green-200 shadow-green-100' : 'border-red-100 shadow-red-50')
                                                            : 'border-gray-100'
                                                    } shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col`}
                                                >
                                                    <div className="h-2" style={{ background: typeInfo.color }} />
                                                    <div className="p-5 flex flex-col flex-1">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div
                                                                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                                                style={{ background: typeInfo.color + '15' }}
                                                            >
                                                                {typeInfo.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-bold text-gray-800 leading-tight truncate">{game.title}</h3>
                                                                <span
                                                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block"
                                                                    style={{ background: typeInfo.color + '15', color: typeInfo.color }}
                                                                >
                                                                    {typeInfo.label}
                                                                </span>
                                                            </div>
                                                            {inst && (
                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center ${inst.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {inst.isActive ? (
                                                                        <><img src={IconSuccess} alt="Activa" className="inline w-3 h-3 mr-1" /> Activa</>
                                                                    ) : (
                                                                        <><img src={IconInactive} alt="Inactiva" className="inline w-3 h-3 mr-1" /> Inactiva</>
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{game.description}</p>
                                                        {game.teacher && (
                                                            <p className="text-xs text-gray-400 mb-3">
                                                                👤 {game.teacher.firstName} {game.teacher.lastName}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                                                            <span style={{ color: diffBadge.hexColor, fontWeight: 600 }}>
                                                                {diffBadge.dot} {diffBadge.label}
                                                            </span>
                                                            <span className="w-px h-3 bg-gray-200" />
                                                            <span>⭐ {game.experience} XP</span>
                                                            <span className="w-px h-3 bg-gray-200" />
                                                            <span>
                                                                📝 {game.totalQuestions}{' '}
                                                                {game.gameType === 'FAST_MEMORY' ? 'pares' : 'preguntas'}
                                                            </span>
                                                        </div>
                                                        {configSummary.length > 0 && (
                                                            <div className="flex gap-2 mb-4 flex-wrap mt-auto">
                                                                {configSummary.map((cfg, i) => (
                                                                    <div key={i} className="flex gap-1 text-[10px] bg-gray-50 rounded-lg px-2 py-1">
                                                                        {cfg.showImage && <span title="Imagen">🖼️</span>}
                                                                        {cfg.showText  && <span title="Texto">📝</span>}
                                                                        {cfg.playAudio && <span title="Audio">🔊</span>}
                                                                        <span className="text-gray-400 ml-1">{cfg.isMazahua ? 'MAZ' : 'ESP'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2 pt-1 mt-auto">
                                                            {!inst ? (
                                                                <button
                                                                    onClick={() => handleAssignFromAll(game)}
                                                                    disabled={assigningAllId === game.id}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-colors disabled:opacity-50"
                                                                    title="Asignar"
                                                                >
                                                                    {assigningAllId === game.id
                                                                        ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                                                        : <span className="material-symbols-outlined text-[16px]">group_add</span>
                                                                    }
                                                                    <span className="hidden sm:inline lg:hidden xl:inline">Asignar</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleToggle(game.id, inst)}
                                                                    disabled={togglingId === game.id}
                                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                                                                        inst.isActive
                                                                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                                                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                                                                    }`}
                                                                    title={inst.isActive ? 'Desactivar' : 'Activar'}
                                                                >
                                                                    {togglingId === game.id
                                                                        ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                                                        : <span className="material-symbols-outlined text-[16px]">
                                                                            {inst.isActive ? 'block' : 'check_circle'}
                                                                        </span>
                                                                    }
                                                                    <span className="hidden sm:inline lg:hidden xl:inline">
                                                                        {inst.isActive ? 'Desactivar' : 'Activar'}
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </section>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl p-1">
                                        <img src={IconQuiz} alt="Quiz" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Quiz</p>
                                        <span className="text-2xl font-bold text-gray-800">{quizCount}</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl p-1">
                                        <img src={IconMemory} alt="Pares" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Pares</p>
                                        <span className="text-2xl font-bold text-gray-800">{pairsCount}</span>
                                    </div>
                                </div>
                                {hasInstances ? (
                                    <>
                                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                                <img src={IconSuccess} alt="Asignadas" className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Asignadas</p>
                                                <span className="text-2xl font-bold text-gray-800">{assignedCount}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                                                <img src={IconInactive} alt="Pausadas" className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Pausadas</p>
                                                <span className="text-2xl font-bold text-gray-800">{pausedCount}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">🎮</div>
                                        <div>
                                            <p className="text-sm text-gray-500">Total</p>
                                            <span className="text-2xl font-bold text-gray-800">{activities.length}</span>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Filter chips */}
                            <div className="flex gap-2 flex-wrap mb-6">
                                {GAME_TYPE_FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFilterType(f.value)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                            filterType === f.value
                                                ? 'bg-green-500 text-white shadow-sm'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {renderContent()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivitiesPanel;
