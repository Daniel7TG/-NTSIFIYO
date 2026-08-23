import React from 'react';
import ActivityApiService from '../../services/ActivityApiService';
import GameService from '../../services/GameService';
import GamesPanel from '../../components/common/GamesPanel';
import PageShell from '../../components/common/PageShell';
import { useAuth } from '../../context/AuthContext';
import { useTeacherInstancesQuery, useTeacherInvalidate } from '../../hooks/useTeacherQueries';

/**
 * Página de Recursos del Maestro.
 * Wrapper de GamesPanel: mismo catálogo que el admin, pero el estado de asignación
 * se evalúa siempre contra el grupo del maestro (sin selector de grupo), y puede
 * asignar / activar / desactivar juegos en ese grupo.
 */
const TeacherResources = () => {
    const { user } = useAuth();
    const { data: instances = [] } = useTeacherInstancesQuery();
    const { reloadInstances }      = useTeacherInvalidate();

    // El grupo del maestro: el de su perfil o, en su defecto, el de sus instancias.
    const groupId = user?.grade
        ?? instances[0]?.group?.id
        ?? instances[0]?.groupId
        ?? null;

    const handleDelete = async (id) => {
        const res = await GameService.deleteGame(id);
        if (!res.success) throw new Error(res.error || 'No se pudo eliminar el juego.');
    };

    const handleAssign = async (game) => {
        // Sin groupId: el backend resuelve el grupo del maestro autenticado.
        const res = await ActivityApiService.assignActivity(game.id);
        if (!res.success) throw new Error(res.error || 'No se pudo asignar el juego.');
    };

    const handleToggle = async (gameId, newState) => {
        const inst      = instances.find(i => i.gameId === gameId || i.game?.id === gameId);
        const instGroup = inst?.group?.id ?? inst?.groupId ?? groupId;
        if (!instGroup) throw new Error('No se encontró el grupo de la instancia.');

        const res = await ActivityApiService.toggleInstance(instGroup, gameId, newState);
        if (!res.success) throw new Error(res.error || 'No se pudo cambiar el estado.');
    };

    return (
        <PageShell>
            <GamesPanel
                title="Mis Recursos"
                subtitle="Gestiona tus actividades y asígnalas a tu grupo."
                createRoute="/maestro/recursos/crear"
                editRoute="/maestro/recursos/editar"
                currentUsername={user?.username}
                fixedGroupId={groupId}
                instances={instances}
                onDelete={handleDelete}
                onAssign={handleAssign}
                onToggle={handleToggle}
                onReloadExtra={reloadInstances}
            />
        </PageShell>
    );
};

export default TeacherResources;
