import React, { useState } from 'react';
import LoadingState from '../../components/common/LoadingState';
import AdminService from '../../services/AdminService';
import { useAlert } from '../../context/AlertContext';
import { useAdminStudentsQuery, useAdminInvalidate } from '../../hooks/useAdminQueries';

const StudentsSection = () => {
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [studentForm, setStudentForm] = useState({ firstname: '', lastname: '', grade: '' });
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);
    const [createStudentError, setCreateStudentError] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', firstName: '', lastName: '', grade: '', listNumber: '', password: '' });
    const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
    const [updateStudentError, setUpdateStudentError] = useState('');

    const { data: studentsList = [], isLoading: isLoadingStudents, error: studentFetchErrorObj } = useAdminStudentsQuery();
    const { reloadStudents: invalidateStudents } = useAdminInvalidate();
    const studentFetchError = studentFetchErrorObj?.message || '';

    const fetchStudents = invalidateStudents;

    // Multi-select & Delete state
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedUsernames, setSelectedUsernames] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showAlert } = useAlert();

    const handleStudentFormChange = (e) => {
        setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        const gradeNum = parseInt(studentForm.grade);
        if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
            setCreateStudentError('El grado debe ser un número entre 1 y 6.');
            return;
        }
        if (!studentForm.firstname || studentForm.firstname.length < 2 || studentForm.firstname.length > 100 || /\d/.test(studentForm.firstname)) {
            setCreateStudentError('El nombre debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        if (!studentForm.lastname || studentForm.lastname.length < 2 || studentForm.lastname.length > 100 || /\d/.test(studentForm.lastname)) {
            setCreateStudentError('El apellido debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        setIsCreatingStudent(true);
        setCreateStudentError('');
        try {
            const data = await AdminService.createUser({
                firstname: studentForm.firstname,
                lastname: studentForm.lastname,
                userType: 'STUDENT',
                grade: gradeNum
            });
            setStudentForm({ firstname: '', lastname: '', grade: '' });
            setIsStudentModalOpen(false);
            fetchStudents();
            showAlert({
                mode: 'success',
                title: '¡Estudiante Creado!',
                message: 'Guarda estas credenciales, no se volverán a mostrar.',
                dataBox: [
                    { label: 'Usuario', value: data.username },
                    { label: 'Contraseña', value: data.password }
                ],
                buttons: [{ text: 'Entendido', type: 'accept' }]
            });
        } catch (error) {
            console.error('Error creating student:', error);
            setCreateStudentError(error.message || 'Ocurrió un error al crear el estudiante.');
        } finally {
            setIsCreatingStudent(false);
        }
    };

    const closeStudentModal = () => {
        setIsStudentModalOpen(false);
        setStudentForm({ firstname: '', lastname: '', grade: '' });
        setCreateStudentError('');
    };

    const openEditModal = (student) => {
        setEditForm({
            username: student.username,
            firstName: student.firstname,
            lastName: student.lastname,
            grade: student.grade,
            listNumber: student.listNumber || '',
            password: ''
        });
        setUpdateStudentError('');
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditForm({ username: '', firstName: '', lastName: '', grade: '', listNumber: '', password: '' });
        setUpdateStudentError('');
    };

    const handleEditFormChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        const gradeNum = parseInt(editForm.grade);
        if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
            setUpdateStudentError('El grado debe ser un número entre 1 y 6.');
            return;
        }
        if (!editForm.firstName || editForm.firstName.length < 2 || editForm.firstName.length > 100 || /\d/.test(editForm.firstName)) {
            setUpdateStudentError('El nombre debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        if (!editForm.lastName || editForm.lastName.length < 2 || editForm.lastName.length > 100 || /\d/.test(editForm.lastName)) {
            setUpdateStudentError('El apellido debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        setIsUpdatingStudent(true);
        setUpdateStudentError('');
        try {
            const body = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                grade: gradeNum,
                listNumber: parseInt(editForm.listNumber)
            };
            if (editForm.password) {
                body.password = editForm.password;
            }
            await AdminService.updateStudent(editForm.username, body);
            closeEditModal();
            fetchStudents();
            showAlert({
                mode: 'success',
                title: '¡Estudiante Actualizado!',
                message: `El estudiante ${editForm.firstName} ${editForm.lastName} ha sido actualizado exitosamente.`,
                buttons: [{ text: 'Entendido', type: 'accept' }]
            });
        } catch (error) {
            console.error('Error updating student:', error);
            setUpdateStudentError(error.message || 'Ocurrió un error al actualizar el estudiante.');
        } finally {
            setIsUpdatingStudent(false);
        }
    };

    const toggleMultiSelect = () => {
        setIsMultiSelectMode(!isMultiSelectMode);
        setSelectedUsernames([]);
    };

    const handleSelectUser = (username) => {
        if (selectedUsernames.includes(username)) {
            setSelectedUsernames(selectedUsernames.filter(u => u !== username));
        } else {
            setSelectedUsernames([...selectedUsernames, username]);
        }
    };

    const handleSelectAll = () => {
        if (selectedUsernames.length === studentsList.length) {
            setSelectedUsernames([]);
        } else {
            setSelectedUsernames(studentsList.map(u => u.username));
        }
    };

    const deleteUser = (username) => {
        showAlert({
            mode: 'alert',
            title: 'Eliminar Estudiante',
            message: `¿Estás seguro de eliminar permanentemente a ${username}? Esta acción es irreversible.`,
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: 'Eliminar',
                    type: 'accept',
                    onClick: async () => {
                        setIsDeleting(true);
                        try {
                            await AdminService.deleteUser(username);
                            fetchStudents();
                        } catch (error) {
                            showAlert({ mode: 'error', title: 'Error', message: error.message });
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        });
    };

    const deleteSelectedUsers = () => {
        if (selectedUsernames.length === 0) return;
        showAlert({
            mode: 'alert',
            title: 'Eliminar Seleccionados',
            message: `¿Estás seguro de eliminar a los ${selectedUsernames.length} estudiantes seleccionados? Esta acción es irreversible.`,
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: `Eliminar ${selectedUsernames.length}`,
                    type: 'accept',
                    onClick: async () => {
                        setIsDeleting(true);
                        try {
                            await AdminService.deleteUsers(selectedUsernames);
                            setSelectedUsernames([]);
                            setIsMultiSelectMode(false);
                            fetchStudents();
                        } catch (error) {
                            showAlert({ mode: 'error', title: 'Error', message: error.message });
                            fetchStudents();
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Estudiantes</h2>
                    <p className="text-gray-500 mt-1">Gestiona los estudiantes del sistema.</p>
                </div>
                <button
                    onClick={() => setIsStudentModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                    Crear Estudiante
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-800">Lista de Estudiantes</h3>
                            <button
                                onClick={fetchStudents}
                                disabled={isLoadingStudents}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-primary transition-colors disabled:opacity-50"
                                title="Recargar datos"
                            >
                                <span className={`material-symbols-outlined text-xl ${isLoadingStudents ? 'animate-spin' : ''}`}>sync</span>
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {isMultiSelectMode && selectedUsernames.length > 0 && (
                                <button
                                    onClick={deleteSelectedUsers}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    Eliminar Seleccionados ({selectedUsernames.length})
                                </button>
                            )}
                            <button
                                onClick={toggleMultiSelect}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 ${isMultiSelectMode ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {isMultiSelectMode ? 'close' : 'checklist'}
                                </span>
                                {isMultiSelectMode ? 'Cancelar Acción' : 'Seleccionar Varios'}
                            </button>
                        </div>
                    </div>

                    {isLoadingStudents ? (
                        <LoadingState message="Cargando estudiantes..." />
                    ) : studentFetchError ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                            <span className="material-symbols-outlined block text-4xl mb-2">error</span>
                            {studentFetchError}
                        </div>
                    ) : studentsList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay estudiantes registrados.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                        {isMultiSelectMode && (
                                            <th className="py-3 px-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={studentsList.length > 0 && selectedUsernames.length === studentsList.length}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                                                />
                                            </th>
                                        )}
                                        <th className="py-3 px-4 font-medium">Username</th>
                                        <th className="py-3 px-4 font-medium">Nombre Completo</th>
                                        <th className="py-3 px-4 font-medium">Nº de Lista</th>
                                        <th className="py-3 px-4 font-medium">Grado</th>
                                        <th className="py-3 px-4 font-medium">Contraseña</th>
                                        <th className="py-3 px-4 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsList.map((s, idx) => (
                                        <tr key={idx} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedUsernames.includes(s.username) ? 'bg-primary/5' : ''}`}>
                                            {isMultiSelectMode && (
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsernames.includes(s.username)}
                                                        onChange={() => handleSelectUser(s.username)}
                                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                                                    />
                                                </td>
                                            )}
                                            <td className="py-3 px-4 text-gray-600">{s.username}</td>
                                            <td className="py-3 px-4 text-gray-800 font-medium">{s.lastname}, {s.firstname}</td>
                                            <td className="py-3 px-4 text-gray-600 text-center">
                                                <span className="inline-block w-8 h-8 leading-8 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                                                    {s.listNumber ?? '-'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                                    {Number(s.grade) > 0 ? `${s.grade}º` : 'No asignado'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{s.password || '******'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(s)}
                                                    className="text-blue-500 hover:text-blue-700 font-medium p-2 rounded-full hover:bg-blue-50 transition-colors mr-1"
                                                    title="Editar estudiante"
                                                >
                                                    <span className="material-symbols-outlined align-middle" style={{ fontSize: '20px' }}>edit</span>
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(s.username)}
                                                    disabled={isDeleting}
                                                    className="text-red-500 hover:text-red-700 font-medium p-2 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Eliminar estudiante"
                                                >
                                                    <span className="material-symbols-outlined align-middle" style={{ fontSize: '20px' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Student Creation Modal */}
            {isStudentModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Crear Nuevo Estudiante</h3>
                            <button onClick={closeStudentModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full max-w-md">
                            <form onSubmit={handleCreateStudent} className="space-y-4">
                                {createStudentError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">{createStudentError}</div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
                                    <input
                                        type="text"
                                        name="firstname"
                                        required
                                        value={studentForm.firstname}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Ej: Maria"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                                    <input
                                        type="text"
                                        name="lastname"
                                        required
                                        value={studentForm.lastname}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Ej: Gómez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                                    <select
                                        name="grade"
                                        required
                                        value={studentForm.grade}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                                    >
                                        <option value="" disabled>Selecciona un grado</option>
                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                            <option key={num} value={num}>{num}º Grado</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={closeStudentModal}
                                        className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingStudent}
                                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isCreatingStudent ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin align-middle" style={{ fontSize: '20px' }}>progress_activity</span>
                                                Creando...
                                            </>
                                        ) : 'Crear Estudiante'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Editar Estudiante</h3>
                            <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full max-w-md">
                            <form onSubmit={handleUpdateStudent} className="space-y-4">
                                {updateStudentError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">{updateStudentError}</div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        required
                                        value={editForm.firstName}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Ej: Maria"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        required
                                        value={editForm.lastName}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Ej: Gómez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                                    <select
                                        name="grade"
                                        required
                                        value={editForm.grade}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                                    >
                                        <option value="" disabled>Selecciona un grado</option>
                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                            <option key={num} value={num}>{num}º Grado</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">No. de Lista</label>
                                    <input
                                        type="number"
                                        name="listNumber"
                                        required
                                        value={editForm.listNumber}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Ej: 5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (opcional)</label>
                                    <input
                                        type="text"
                                        name="password"
                                        value={editForm.password}
                                        onChange={handleEditFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Dejar vacío para no cambiar"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={closeEditModal}
                                        className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdatingStudent}
                                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isUpdatingStudent ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin align-middle" style={{ fontSize: '20px' }}>progress_activity</span>
                                                Actualizando...
                                            </>
                                        ) : 'Actualizar Estudiante'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsSection;
