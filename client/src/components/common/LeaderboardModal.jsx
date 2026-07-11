import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LoadingState from './LoadingState';
import AvatarCard from './AvatarCard';
import { useLeaderboardQuery } from '../../hooks/useLeaderboardQueries';

const PAGE_SIZE = 20; // el backend acepta hasta 50

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const getRankBg = (rank) => {
    switch (rank) {
        case 1:  return 'bg-amber-50 border-amber-200';
        case 2:  return 'bg-gray-50 border-gray-200';
        case 3:  return 'bg-orange-50 border-orange-200';
        default: return 'bg-white border-gray-100';
    }
};

/**
 * Fila de la tabla. `row` = { username, name, avatarId, level, experience, finishedActivities, rank }
 */
const LeaderboardRow = ({ row, isCurrentUser, highlight = false }) => (
    <div
        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${getRankBg(row.rank)} ${
            isCurrentUser ? 'ring-2 ring-amber-300 ring-offset-1' : 'hover:bg-gray-50'
        } ${highlight ? 'shadow-sm' : ''}`}
    >
        {/* Posición */}
        <div className="w-10 text-center flex-shrink-0">
            {MEDALS[row.rank] ? (
                <span className="text-xl">{MEDALS[row.rank]}</span>
            ) : (
                <span className="text-sm font-bold text-gray-400">#{row.rank}</span>
            )}
        </div>

        {/* Avatar */}
        <AvatarCard avatarId={row.avatarId} alt={row.name || row.username} size="md" />

        {/* Nombre + nivel */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
                <span className={`truncate ${isCurrentUser ? 'font-bold text-gray-800' : 'font-medium text-gray-700'}`}>
                    {row.name || row.username}
                </span>
                {isCurrentUser && (
                    <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                        Tú
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">Nivel {row.level ?? 1}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-400">
                    {row.finishedActivities ?? 0} actividad{(row.finishedActivities ?? 0) === 1 ? '' : 'es'}
                </span>
            </div>
        </div>

        {/* XP */}
        <div className="flex-shrink-0 text-right">
            <span className="text-sm font-bold text-amber-500">
                {(row.experience ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-0.5">XP</span>
        </div>
    </div>
);

/**
 * Popup con la tabla de puntuaciones paginada (GET /api/leaderboard).
 * El backend decide qué tabla ver según el tipo del usuario autenticado:
 * estudiante ve estudiantes, visitante ve visitantes. `userType` solo aplica
 * a maestro/admin, que no compiten y eligen la tabla.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - currentUsername: string — para resaltar la fila propia
 *  - userType?: 'STUDENT' | 'VISITOR' — solo maestro/admin
 */
const LeaderboardModal = ({ isOpen, onClose, currentUsername, userType }) => {
    const [page, setPage] = useState(0);

    const { data, isLoading, isFetching, error } = useLeaderboardQuery({
        page,
        size: PAGE_SIZE,
        userType,
        enabled: isOpen,
    });

    const rows        = data?.data ?? [];
    const currentUser = data?.currentUser ?? null;
    const pageInfo    = data?.page ?? { number: 0, totalPages: 0, totalElements: 0 };

    // Al reabrir, volver a la primera página.
    useEffect(() => {
        if (isOpen) setPage(0);
    }, [isOpen]);

    // Bloquear scroll del body mientras el popup está abierto.
    useEffect(() => {
        if (!isOpen) return undefined;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Cerrar con Escape.
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // El backend siempre manda currentUser con su rank global; solo lo fijamos
    // abajo cuando su fila no cae en la página visible.
    const currentUserOnPage = currentUser
        ? rows.some(r => r.username === currentUser.username)
        : false;

    // Montado en <body>: dentro de la tarjeta que lo abre, los `transform`/`overflow`
    // del contenedor recortan el overlay y lo dejan atrapado en la tarjeta.
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Tabla de puntuaciones"
            >
                {/* Cabecera */}
                <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-amber-500 text-2xl">leaderboard</span>
                        <div className="min-w-0">
                            <h2 className="font-extrabold text-gray-800 truncate">Tabla de Puntuaciones</h2>
                            {pageInfo.totalElements > 0 && (
                                <p className="text-xs text-gray-500">
                                    {pageInfo.totalElements} participante{pageInfo.totalElements === 1 ? '' : 's'}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white/70 transition-colors flex-shrink-0"
                        aria-label="Cerrar"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Cuerpo */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {isLoading && <LoadingState message="Cargando puntuaciones..." />}

                    {error && !isLoading && (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-red-300 block mb-2">error</span>
                            <p className="text-sm text-gray-500">{error.message}</p>
                        </div>
                    )}

                    {!isLoading && !error && rows.length === 0 && (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">group</span>
                            <p className="text-sm text-gray-500">Aún no hay participantes en la tabla.</p>
                        </div>
                    )}

                    {!isLoading && !error && rows.length > 0 && (
                        <div className={`space-y-2 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                            {rows.map(row => (
                                <LeaderboardRow
                                    key={row.username}
                                    row={row}
                                    isCurrentUser={row.username === currentUsername}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Fila propia fijada cuando cae fuera de la página visible */}
                {!isLoading && !error && currentUser && !currentUserOnPage && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/40">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Tu posición
                        </p>
                        <LeaderboardRow row={currentUser} isCurrentUser highlight />
                    </div>
                )}

                {/* Paginación */}
                {pageInfo.totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={pageInfo.number === 0 || isFetching}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            Anterior
                        </button>

                        <p className="text-sm text-gray-500">
                            Página <span className="font-semibold text-gray-700">{pageInfo.number + 1}</span> de{' '}
                            <span className="font-semibold text-gray-700">{pageInfo.totalPages}</span>
                        </p>

                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={pageInfo.number + 1 >= pageInfo.totalPages || isFetching}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-[#FF9800] rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        >
                            Siguiente
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default LeaderboardModal;
