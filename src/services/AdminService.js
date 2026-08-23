// client/src/services/AdminService.js
// Servicio de administración: usuarios (maestros/estudiantes) y grupos

import apiConfig from './apiConfig';

class AdminService {

    // ─────────────────────────────────────────────
    // USUARIOS
    // ─────────────────────────────────────────────

    /**
     * Obtener todos los maestros
     * GET /api/admin/teacher
     */
    async getTeachers() {
        const data = await apiConfig.get('/api/admin/teacher');
        return data; // retorna array de maestros
    }

    /**
     * Obtener todos los estudiantes
     * GET /api/admin/students
     */
    async getStudents() {
        const data = await apiConfig.get('/api/admin/students');
        return data.students || [];
    }

    /**
     * Obtener estudiantes disponibles (sin grupo asignado)
     * GET /api/user/available
     */
    async getAvailableStudents() {
        const data = await apiConfig.get('/api/user/available');
        return data.students || [];
    }

    /**
     * Crear un usuario (maestro o estudiante)
     * POST /api/admin/users
     * @param {{ firstname, lastname, userType, grade? }} body
     */
    async createUser(body) {
        return apiConfig.post('/api/admin/users', body);
    }

    /**
     * Eliminar un usuario por username
     * DELETE /api/admin/users/{username}
     * @param {string} username
     */
    async deleteUser(username) {
        return apiConfig.delete(`/api/admin/users/${username}`);
    }

    /**
     * Editar un estudiante existente
     * PUT /api/admin/students/{username}
     * @param {string} username
     * @param {{ firstName, lastName, grade, listNumber, password? }} body
     */
    async updateStudent(username, body) {
        return apiConfig.put(`/api/admin/students/${username}`, body);
    }

    /**
     * Editar un maestro existente
     * PUT /api/admin/teachers/{username}
     * @param {string} username
     * @param {{ firstName, lastName, password? }} body
     */
    async updateTeacher(username, body) {
        return apiConfig.put(`/api/admin/teachers/${username}`, body);
    }

    /**
     * Eliminar múltiples usuarios en paralelo
     * @param {string[]} usernames
     */
    async deleteUsers(usernames) {
        return Promise.all(usernames.map(u => this.deleteUser(u)));
    }

    // ─────────────────────────────────────────────
    // DASHBOARD ADMINISTRADOR
    // ─────────────────────────────────────────────

    /**
     * Obtener estadísticas globales de la plataforma
     * GET /api/dashboard/admin
     */
    async getAdminDashboard() {
        const data = await apiConfig.get('/api/dashboard/admin');
        return data;
    }

    // ─────────────────────────────────────────────
    // GRUPOS
    // ─────────────────────────────────────────────

    /**
     * Obtener todos los grupos
     * GET /api/groups
     */
    async getGroups() {
        const data = await apiConfig.get('/api/groups');
        return data.groups || [];
    }

    /**
     * Obtener los estudiantes de un grupo
     * GET /api/groups/{grade}/students
     * @param {number} grade
     */
    async getGroupStudents(grade) {
        const data = await apiConfig.get(`/api/groups/${grade}/students`);
        return data.students || [];
    }

    /**
     * Obtener los estudiantes del grupo del usuario autenticado (maestro).
     * GET /api/groups/students — el backend resuelve el grupo desde el token.
     * @returns {Promise<Array>}
     */
    async getMyGroupStudents() {
        const data = await apiConfig.get('/api/groups/students');
        return data.students || [];
    }

    /**
     * Crear un nuevo grupo
     * POST /api/groups/{grade}
     * @param {number} grade
     * @param {{ studentsUsername: string[], teacherUsername: string|null }} body
     */
    async createGroup(grade, body) {
        return apiConfig.post(`/api/groups/${grade}`, body);
    }

    // ─── Maestro en grupo ───

    /**
     * Asignar un maestro a un grupo
     * POST /api/groups/{grade}/teacher/{teacherUsername}
     */
    async addTeacherToGroup(grade, teacherUsername) {
        return apiConfig.post(`/api/groups/${grade}/teacher/${teacherUsername}`);
    }

    /**
     * Mover un maestro a otro grupo
     * PUT /api/groups/{targetGrade}/teacher/{teacherUsername}
     */
    async moveTeacherToGroup(targetGrade, teacherUsername) {
        return apiConfig.put(`/api/groups/${targetGrade}/teacher/${teacherUsername}`);
    }

    /**
     * Remover un maestro de un grupo
     * DELETE /api/groups/{grade}/teacher/{teacherUsername}
     */
    async removeTeacherFromGroup(grade, teacherUsername) {
        return apiConfig.delete(`/api/groups/${grade}/teacher/${teacherUsername}`);
    }

    // ─── Estudiantes en grupo ───

    /**
     * Agregar un estudiante a un grupo
     * POST /api/groups/{grade}/students/{studentUsername}
     */
    async addStudentToGroup(grade, studentUsername) {
        return apiConfig.post(`/api/groups/${grade}/students/${studentUsername}`);
    }

    /**
     * Mover un estudiante a otro grupo
     * PUT /api/groups/{targetGrade}/students/{studentUsername}
     */
    async moveStudentToGroup(targetGrade, studentUsername) {
        return apiConfig.put(`/api/groups/${targetGrade}/students/${studentUsername}`);
    }

    /**
     * Remover un estudiante de un grupo
     * DELETE /api/groups/{grade}/students/{studentUsername}
     */
    async removeStudentFromGroup(grade, studentUsername) {
        return apiConfig.delete(`/api/groups/${grade}/students/${studentUsername}`);
    }

    /**
     * Agregar múltiples estudiantes a un grupo en paralelo
     * @param {number} grade
     * @param {string[]} studentUsernames
     */
    async addStudentsToGroup(grade, studentUsernames) {
        const results = await Promise.all(
            studentUsernames.map(username =>
                this.addStudentToGroup(grade, username)
                    .catch(err => { throw new Error(err.message || `Error al agregar estudiante ${username}`); })
            )
        );
        return results;
    }

    /**
     * Avanzar de año escolar: sube de grado a todos los alumnos y gradúa a los de 6º.
     * POST /api/groups/advance-year
     * @returns {Promise<{ promoted: number, graduated: number, processed: number }>}
     */
    async advanceYear() {
        return apiConfig.post('/api/groups/advance-year');
    }
}

export default new AdminService();
