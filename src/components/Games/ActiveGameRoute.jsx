import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { getActivitiesList } from '../../config/activityConfig';

export default function ActiveGameRoute({ children }) {
    const { currentGameData } = useGame();
    const { activityId } = useParams();
    const { pathname } = useLocation();
    const catalogPath = pathname.split('/jugar/')[0];
    const family = getActivitiesList().find(game => game.basePath === catalogPath);
    const matchesFamily = !currentGameData?.gameType || currentGameData.gameType === family?.type;
    if (currentGameData && String(currentGameData.activityId) === activityId && matchesFamily) return children;
    return <main className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Inicia la actividad para jugar</h1>
        <p className="mb-6">Abre la actividad desde el catálogo o tus asignaciones para comenzar la partida.</p>
        <Link to={catalogPath} className="text-primary underline">Volver a las actividades</Link>
    </main>;
}
