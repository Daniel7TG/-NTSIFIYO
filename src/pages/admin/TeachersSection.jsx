import React, { useState } from 'react';
import LoadingState from '../../components/common/LoadingState';
import AdminService from '../../services/AdminService';
import { useAlert } from '../../context/AlertContext';
import { useAdminTeachersQuery, useAdminInvalidate } from '../../hooks/useAdminQueries';

const TeachersSection = () => {
    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
    const [teacherForm, setTeacherForm] = useState({ firstname: '', lastname: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', firstName: '', lastName: '', password: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const { data: teachersList = [], isLoading: isLoadingTeachers, error: teacherFetchErrorObj } = useAdminTeachersQuery();
    const { reloadTeachers: invalidateTeachers } = useAdminInvalidate();
    const teacherFetchError = teacherFetchErrorObj?.message || '';

    const fetchTeachers = invalidateTeachers;

    // Multi-select & Delete state
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedUsernames, setSelectedUsernames] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showAlert } = useAlert();

    const handleTeacherFormChange = (e) => {
        setTeacherForm({ ...teacherForm, [e.target.name]: e.target.value });
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        if (!teacherForm.firstname || teacherForm.firstname.length < 2 || teacherForm.firstname.length > 100 || /\d/.test(teacherForm.firstname)) {
            setCreateError('El nombre debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        if (!teacherForm.lastname || teacherForm.lastname.length < 2 || teacherForm.lastname.length > 100 || /\d/.test(teacherForm.lastname)) {
            setCreateError('El apellido debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        setIsCreating(true);
        setCreateError('');
        try {
            const data = await AdminService.createUser({ ...teacherForm, userType: 'TEACHER' });
            setTeacherForm({ firstname: '', lastname: '' });
            setIsTeacherModalOpen(false);
            fetchTeachers();
            showAlert({
                mode: 'success',
                title: '¡Maestro Creado!',
                message: 'Guarda estas credenciales, no se volverán a mostrar.',
                dataBox: [
                    { label: 'Usuario', value: data.username },
                    { label: 'Contraseña', value: data.password }
                ],
                buttons: [{ text: 'Entendido', type: 'accept' }]
            });
        } catch (error) {
            console.error('Error creating teacher:', error);
            setCreateError(error.message || 'Ocurrió un error al crear el maestro.');
        } finally {
            setIsCreating(false);
        }
    };

    const closeTeacherModal = () => {
        setIsTeacherModalOpen(false);
        setTeacherForm({ firstname: '', lastname: '' });
        setCreateError('');
    };

    const openEditModal = (teacher) => {
        setEditForm({
            username: teacher.username,
            firstName: teacher.firstname,
            lastName: teacher.lastname,
            password: ''
        });
        setUpdateError('');
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditForm({ username: '', firstName: '', lastName: '', password: '' });
        setUpdateError('');
    };

    const handleEditFormChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleUpdateTeacher = async (e) => {
        e.preventDefault();
        if (!editForm.firstName || editForm.firstName.length < 2 || editForm.firstName.length > 100 || /\d/.test(editForm.firstName)) {
            setUpdateError('El nombre debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        if (!editForm.lastName || editForm.lastName.length < 2 || editForm.lastName.length > 100 || /\d/.test(editForm.lastName)) {
            setUpdateError('El apellido debe tener entre 2 y 100 caracteres y no contener números.');
            return;
        }
        if (editForm.password && editForm.password.length < 6) {
            setUpdateError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setIsUpdating(true);
        setUpdateError('');
        try {
            const body = {
                firstName: editForm.firstName,
                lastName: editForm.lastName
            };
            if (editForm.password) {
                body.password = editForm.password;
            }
            await AdminService.updateTeacher(editForm.username, body);
            closeEditModal();
            fetchTeachers();
            showAlert({
                mode: 'success',
                title: '¡Maestro Actualizado!',
                message: `El maestro ${editForm.firstName} ${editForm.lastName} ha sido actualizado exitosamente.`,
                buttons: [{ text: 'Entendido', type: 'accept' }]
            });
        } catch (error) {
            console.error('Error updating teacher:', error);
            setUpdateError(error.message || 'Ocurrió un error al actualizar el maestro.');
        } finally {
            setIsUpdating(false);
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
        if (selectedUsernames.length === teachersList.length) {
            setSelectedUsernames([]);
        } else {
            setSelectedUsernames(teachersList.map(u => u.username));
        }
    };

    const deleteUser = (username) => {
        showAlert({
            mode: 'alert',
            title: 'Eliminar Maestro',
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
                            fetchTeachers();
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
            message: `¿Estás seguro de eliminar a los ${selectedUsernames.length} maestros seleccionados? Esta acción es irreversible.`,
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
                            fetchTeachers();
                        } catch (error) {
                            showAlert({ mode: 'error', title: 'Error', message: error.message });
                            fetchTeachers();
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
                    <h2 className="text-3xl font-bold text-gray-800">Maestros</h2>
                    <p className="text-gray-500 mt-1">Gestiona los maestros del sistema.</p>
                </div>
                <button
                    onClick={() => setIsTeacherModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined">add</span>
                    Crear Maestro
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-800">Lista de Maestros</h3>
                            <button
                                onClick={fetchTeachers}
                                disabled={isLoadingTeachers}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-primary transition-colors disabled:opacity-50"
                                title="Recargar datos"
                            >
                                <span className={`material-symbols-outlined text-xl ${isLoadingTeachers ? 'animate-spin' : ''}`}>sync</span>
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

                    {isLoadingTeachers ? (
                        <LoadingState message="Cargando maestros..." />
                    ) : teacherFetchError ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                            <span className="material-symbols-outlined block text-4xl mb-2">error</span>
                            {teacherFetchError}
                        </div>
                    ) : teachersList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay maestros registrados.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                        {isMultiSelectMode && (
                                            <th className="py-3 px-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={teachersList.length > 0 && selectedUsernames.length === teachersList.length}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                                                />
                                            </th>
                                        )}
                                        <th className="py-3 px-4 font-medium">Nombre</th>
                                        <th className="py-3 px-4 font-medium">Username</th>
                                        <th className="py-3 px-4 font-medium">Alumnos</th>
                                        <th className="py-3 px-4 font-medium">Grado Asignado</th>
                                        <th className="py-3 px-4 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachersList.map((t, idx) => (
                                        <tr key={idx} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedUsernames.includes(t.username) ? 'bg-primary/5' : ''}`}>
                                            {isMultiSelectMode && (
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsernames.includes(t.username)}
                                                        onChange={() => handleSelectUser(t.username)}
                                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                                                    />
                                                </td>
                                            )}
                                            <td className="py-3 px-4 text-gray-800 font-medium">{t.lastname}, {t.firstname}</td>
                                            <td className="py-3 px-4 text-gray-600">{t.username}</td>
                                            <td className="py-3 px-4 text-gray-600">{t.students_amount || 0}</td>
                                            <td className="py-3 px-4">
                                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                                                    {t.grade || 'No asignado'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(t)}
                                                    className="text-blue-500 hover:text-blue-700 font-medium p-2 rounded-full hover:bg-blue-50 transition-colors mr-1"
                                                    title="Editar maestro"
                                                >
                                                    <span className="material-symbols-outlined align-middle" style={{ fontSize: '20px' }}>edit</span>
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(t.username)}
                                                    disabled={isDeleting}
                                                    className="text-red-500 hover:text-red-700 font-medium p-2 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Eliminar maestro"
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

            {/* Teacher Creation Modal */}
            {isTeacherModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Crear Nuevo Maestro</h3>
                            <button onClick={closeTeacherModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full max-w-md">
                            <form onSubmit={handleCreateTeacher} className="space-y-4">
                                {createError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">{createError}</div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
                                    <input
                                        type="text"
                                        name="firstname"
                                        required
                                        value={teacherForm.firstname}
                                        onChange={handleTeacherFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Ej: Juan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                                    <input
                                        type="text"
                                        name="lastname"
                                        required
                                        value={teacherForm.lastname}
                                        onChange={handleTeacherFormChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="Ej: Pérez"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={closeTeacherModal}
                                        className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin align-middle" style={{ fontSize: '20px' }}>progress_activity</span>
                                                Creando...
                                            </>
                                        ) : 'Crear Maestro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Editar Maestro</h3>
                            <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full max-w-md">
                            <form onSubmit={handleUpdateTeacher} className="space-y-4">
                                {updateError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">{updateError}</div>
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
                                        placeholder="Ej: Juan"
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
                                        placeholder="Ej: Pérez"
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
                                        disabled={isUpdating}
                                        className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin align-middle" style={{ fontSize: '20px' }}>progress_activity</span>
                                                Actualizando...
                                            </>
                                        ) : 'Actualizar Maestro'}
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

export default TeachersSection;
