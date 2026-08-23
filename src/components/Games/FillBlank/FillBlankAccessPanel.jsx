import React from 'react';
import GameAccessPanel from '../GamePanel/GameAccessPanel';
import { ActivityTypes } from '../../../config/activityConfig';

const FillBlankAccessPanel = () => {
    return (
        <GameAccessPanel
            gameType={ActivityTypes.FILL_BLANK}
            icon="📝"
            title="Completar Oración"
            subtitle="Rellena el espacio en blanco"
            gameBasePath="/games/fill_blank"
            cardIcon={<span className="material-symbols-outlined">edit_note</span>}
            tipTeacher="Crea oraciones con espacios en blanco para que tus alumnos practiquen vocabulario"
            tipStudent="Lee con atención y selecciona la palabra correcta para completar la oración"
        />
    );
};

export default FillBlankAccessPanel;
