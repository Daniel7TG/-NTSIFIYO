import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function useGameMapPath() {
    const { state } = useLocation();
    const { user } = useAuth();
    const path = user?.userType === 'VISITOR' ? '/visitante/mapa' : '/estudiante/mapa';
    return state?.returnPath === path ? state.returnPath : path;
}
