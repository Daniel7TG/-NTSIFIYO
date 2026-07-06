import React, { useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import GameAccessPanel from './GamePanel/GameAccessPanel';
import Breadcrumb from '../common/Breadcrumb';
import { ACTIVITY_CONFIG } from '../../config/activityConfig';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { useAuth } from '../../context/AuthContext';
import Roles from '../../utils/roles';

function GameAccessView() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { updateBreadcrumbs } = useBreadcrumb();
    const { user } = useAuth();

    // Encontramos la configuración del juego por su base_path que coincida con el gameId
    // ACTIVITY_CONFIG usa ids como 'memoria_rapida', 'memorama', etc.
    const metadata = Object.values(ACTIVITY_CONFIG).find(meta => meta.id === gameId);

    useEffect(() => {
        if (metadata) {
            updateBreadcrumbs([
                { label: metadata.title }
            ]);
        }
    }, [metadata, updateBreadcrumbs]);

    if (!metadata) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="w-full flex-1 relative min-h-screen">
            <div className="w-full">
                <div className="max-w-6xl mx-auto p-6 pt-4">
                    <div className="mb-6">
                        <Breadcrumb />
                    </div>
                    <GameAccessPanel
                        gameType={metadata.type}
                        icon={metadata.icon}
                        title={metadata.title}
                        subtitle={metadata.subtitle}
                        gameBasePath={metadata.basePath}
                        color={metadata.color}
                        cardIcon={<span className="material-symbols-outlined">{metadata.materialIcon}</span>}
                    />
                </div>
            </div>
        </div>
    );
}

export default GameAccessView;
