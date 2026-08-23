const DIFFICULTY_BADGES = {
    'EASY': { id: 'EASY', label: 'Fácil', color: 'bg-green-100 text-green-700', dot: '🟢', hexColor: '#22c55e' },
    'MEDIUM': { id: 'MEDIUM', label: 'Medio', color: 'bg-amber-100 text-amber-700', dot: '🟡', hexColor: '#f59e0b' },
    'HARD': { id: 'HARD', label: 'Difícil', color: 'bg-red-100 text-red-700', dot: '🔴', hexColor: '#ef4444' },
};

export const getDifficultyBadge = (diff) => {
    return DIFFICULTY_BADGES[diff] || { id: diff, label: diff, color: 'bg-gray-100 text-gray-700', dot: '⚪', hexColor: '#6b7280' };
};

export default DIFFICULTY_BADGES;
