import React from 'react';
import ActivityApiService from '../../services/ActivityApiService';
import GameService from '../../services/GameService';
import GamesPanel from '../../components/common/GamesPanel';
import PageShell from '../../components/common/PageShell';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useTeacherGroupQuery, useTeacherInstancesQuery, useTeacherInvalidate } from '../../hooks/useTeacherQueries';

/**
 * Página de Recursos del Maestro.
 * Wrapper de GamesPanel: mismo catálogo que el admin, pero el estado de asignación
 * se evalúa siempre contra el grupo del maestro (sin selector de grupo), y puede
 * asignar / activar / desactivar juegos en ese grupo.
 */
const TeacherResources = () => {
    const { user } = useAuth();
    const { data: group, isLoading, error: groupError } = useTeacherGroupQuery();
    const { data: instances = [], isLoading: instancesLoading, error: instancesError } = useTeacherInstancesQuery();
    const { reloadInstances } = useTeacherInvalidate();
    const groupId = group?.groupId ?? null;
    const error = groupError || instancesError;

    const handleDelete = async (id) => {
        const res = await GameService.deleteGame(id);
        if (!res.success) throw new Error(res.error || 'No se pudo eliminar el juego.');
    };

    const handleAssign = async (game) => {
        if (!groupId) throw new Error('Solicita al administrador que te asigne un grupo.');
        const res = await ActivityApiService.assignActivity(game.id, groupId);
        if (!res.success) throw new Error(res.error || 'No se pudo asignar el juego.');
    };

    const handleToggle = async (gameId, newState) => {
        const inst      = instances.find(i => i.gameId === gameId || i.game?.id === gameId);
        const instGroup = inst?.group?.id ?? inst?.groupId ?? groupId;
        if (!instGroup) throw new Error('No se encontró el grupo de la instancia.');

        const res = await ActivityApiService.toggleInstance(instGroup, gameId, newState);
        if (!res.success) throw new Error(res.error || 'No se pudo cambiar el estado.');
    };

    if (isLoading || instancesLoading) {
        return <PageShell><LoadingState message="Cargando los recursos de tu grupo..." /></PageShell>;
    }
    if (error) {
        return <PageShell><ErrorState message={error.message} onRetry={reloadInstances} dashboardPath="/dashboard" /></PageShell>;
    }

    return (
        <PageShell>
            {!groupId && <p className="mb-6 rounded-xl bg-amber-50 p-4 text-amber-800">Solicita al administrador que te asigne un grupo para asignar actividades.</p>}
            <GamesPanel
                title="Mis Recursos"
                subtitle="Gestiona tus actividades y asígnalas a tu grupo."
                createRoute="/maestro/recursos/crear"
                editRoute="/maestro/recursos/editar"
                currentUsername={user?.username}
                fixedGroupId={groupId}
                instances={instances}
                onDelete={handleDelete}
                onAssign={groupId ? handleAssign : undefined}
                onToggle={handleToggle}
                onReloadExtra={reloadInstances}
            />
        </PageShell>
    );
};

export default TeacherResources;
