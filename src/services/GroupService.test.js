import GroupService from './GroupService';
import apiConfig from './apiConfig';

jest.mock('./apiConfig', () => ({ get: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

it('consulta el grupo propio sin usar el grado o las actividades', async () => {
    apiConfig.get.mockResolvedValue({ groupId: 42, grade: 3 });
    await expect(GroupService.getMyGroup()).resolves.toEqual({ groupId: 42, grade: 3 });
    expect(apiConfig.get).toHaveBeenCalledWith('/api/groups/me');
});

it('acepta únicamente la ausencia explícita del grupo', async () => {
    apiConfig.get.mockResolvedValue({ groupId: null, grade: null });
    await expect(GroupService.getMyGroup()).resolves.toEqual({ groupId: null, grade: null });
});

it.each([{}, null, { groupId: 0, grade: 3 }, { groupId: 42 }, { groupId: null, grade: 3 }])(
    'no confunde una respuesta inválida con falta de grupo: %s', async (data) => {
        apiConfig.get.mockResolvedValue(data);
        await expect(GroupService.getMyGroup()).rejects.toThrow('El servidor no devolvió los datos del grupo');
    },
);

it('propaga los fallos del backend en vez de indicar sin grupo', async () => {
    apiConfig.get.mockRejectedValue(new Error('Error: 500'));
    await expect(GroupService.getMyGroup()).rejects.toThrow('Error: 500');
});
