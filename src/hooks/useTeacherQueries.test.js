import { fetchTeacherDashboard, fetchTeacherAssignments, fetchTeacherInstances } from './useTeacherQueries';
import ActivityApiService from '../services/ActivityApiService';

jest.mock('../services/ActivityApiService', () => ({
    getTeacherDashboard: jest.fn(), getActiveAssignments: jest.fn(), getGroupInstances: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());

it('muestra los alumnos del grupo aunque no tenga actividades', async () => {
    ActivityApiService.getTeacherDashboard.mockResolvedValue({
        success: true,
        data: { totalStudents: 1, activeAssignments: [], alertStudents: [], completeStudents: [] },
    });
    const result = await fetchTeacherDashboard({ groupId: 42, grade: 3 });
    expect(result).toMatchObject({ groupId: 42, grade: 3, noGroup: false, totalStudents: 1, activeAssignments: [] });
    expect(ActivityApiService.getTeacherDashboard).toHaveBeenCalledWith(42);
    expect(ActivityApiService.getGroupInstances).not.toHaveBeenCalled();
});

it('solo marca sin grupo ante una respuesta explícita del backend', async () => {
    const result = await fetchTeacherDashboard({ groupId: null, grade: null });
    expect(result.noGroup).toBe(true);
    expect(ActivityApiService.getTeacherDashboard).not.toHaveBeenCalled();
});

it('las asignaciones consultan el ID real, independiente del grado', async () => {
    ActivityApiService.getActiveAssignments.mockResolvedValue({ success: true, data: [] });
    const result = await fetchTeacherAssignments({ groupId: 42, grade: 3 });
    expect(result).toEqual({ groupId: 42, grade: 3, activities: [], noGroup: false });
    expect(ActivityApiService.getActiveAssignments).toHaveBeenCalledWith(42, true);
});

it('un error de métricas no genera un dashboard vacío', async () => {
    ActivityApiService.getTeacherDashboard.mockResolvedValue({ success: false, error: 'Error del servidor' });
    await expect(fetchTeacherDashboard({ groupId: 42, grade: 3 })).rejects.toThrow('Error del servidor');
});

it('no consulta instancias cuando el docente no tiene grupo', async () => {
    await expect(fetchTeacherInstances({ groupId: null, grade: null })).resolves.toEqual([]);
    expect(ActivityApiService.getGroupInstances).not.toHaveBeenCalled();
});

it('un fallo de instancias no se presenta como una lista vacía', async () => {
    ActivityApiService.getGroupInstances.mockResolvedValue({ success: false, error: 'Error del servidor' });
    await expect(fetchTeacherInstances({ groupId: 42, grade: 3 })).rejects.toThrow('Error del servidor');
});
