import apiConfig from './apiConfig';

const GroupService = {
    async getMyGroup() {
        const group = await apiConfig.get('/api/groups/me');
        if (group?.groupId === null && group?.grade === null) return group;
        if (!Number.isSafeInteger(group?.groupId) || group.groupId <= 0
            || !Number.isInteger(group?.grade) || group.grade <= 0) {
            throw new Error('El servidor no devolvió los datos del grupo. Intenta actualizar.');
        }
        return group;
    },
};

export default GroupService;
