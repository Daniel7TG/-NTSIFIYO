import React from 'react';
import GameService from '../../services/GameService';
import GamesPanel from '../../components/common/GamesPanel';
import { useAuth } from '../../context/AuthContext';
import { useAdminTeachersQuery, useAdminGroupsQuery } from '../../hooks/useAdminQueries';

/**
 * Sección de Actividades del Administrador.
 * Wrapper de GamesPanel: el admin ve el catálogo completo y puede filtrar por
 * maestro y por estado de asignación respecto a cualquier grupo.
 */
const AdminActivitiesSection = () => {
    const { user } = useAuth();
    const { data: teachers = [] } = useAdminTeachersQuery();
    const { data: groups   = [] } = useAdminGroupsQuery();

    const handleDelete = async (id) => {
        const res = await GameService.deleteGame(id);
        if (!res.success) throw new Error(res.error || 'No se pudo eliminar el juego.');
    };

    return (
        <GamesPanel
            title="Actividades"
            subtitle="Gestiona todos los juegos y actividades del sistema."
            createRoute="/admin/actividades/crear"
            editRoute="/admin/actividades/editar"
            currentUsername={user?.username}
            onDelete={handleDelete}
            teachers={teachers}
            groups={groups}
        />
    );
};

export default AdminActivitiesSection;
