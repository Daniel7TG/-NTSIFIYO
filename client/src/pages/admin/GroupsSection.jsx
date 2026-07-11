import React, { useState, useEffect } from 'react';
import AdminService from '../../services/AdminService';
import { useAlert } from '../../context/AlertContext';

const GroupsSection = () => {
    // Groups list
    const [groupsList, setGroupsList] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [groupFetchError, setGroupFetchError] = useState('');

    // Group detail view
    const [activeGroupView, setActiveGroupView] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupStudentsList, setGroupStudentsList] = useState([]);
    const [isLoadingGroupStudents, setIsLoadingGroupStudents] = useState(false);
    const [groupStudentsError, setGroupStudentsError] = useState('');

    // Group Action Modal (Move/Add teacher/students)
    const [groupActionModal, setGroupActionModal] = useState({ isOpen: false, type: '', targetUser: null });
    const [groupActionTargetGrade, setGroupActionTargetGrade] = useState('');
    const [groupActionError, setGroupActionError] = useState('');
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [tempSelectedStudents, setTempSelectedStudents] = useState([]);

    // Create Group Modal
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [createGroupStep, setCreateGroupStep] = useState('MAIN');
    const [createGroupForm, setCreateGroupForm] = useState({ grade: '', teacherUsername: '', studentsUsername: [] });
    const [isGradeLocked, setIsGradeLocked] = useState(false);
    const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
    const [createGroupError, setCreateGroupError] = useState('');

    const [isAdvancingYear, setIsAdvancingYear] = useState(false);

    const [teachersList, setTeachersList] = useState([]);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
    const [teacherFetchError, setTeacherFetchError] = useState('');
    const [hasFetchedTeachers, setHasFetchedTeachers] = useState(false);

    const [availableStudents, setAvailableStudents] = useState([]);
    const [isLoadingAvailableStudents, setIsLoadingAvailableStudents] = useState(false);
    const [hasFetchedAvailableStudents, setHasFetchedAvailableStudents] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchGroups();
    }, []);

    // Keep selectedGroup in sync with groupsList
    useEffect(() => {
        if (activeGroupView && groupsList.length > 0) {
            const updatedGroup = groupsList.find(g => g.grade === activeGroupView);
            if (updatedGroup) setSelectedGroup(updatedGroup);
        }
    }, [groupsList, activeGroupView]);

    const fetchGroups = async () => {
        setIsLoadingGroups(true);
        setGroupFetchError('');
        try {
            const data = await AdminService.getGroups();
            setGroupsList(data);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setGroupFetchError(error.message || 'Error de conexión al cargar grupos.');
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const fetchGroupStudents = async (grade) => {
        setIsLoadingGroupStudents(true);
        setGroupStudentsError('');
        setGroupStudentsList([]);
        try {
            const data = await AdminService.getGroupStudents(grade);
            setGroupStudentsList(data);
        } catch (error) {
            console.error('Error fetching group students:', error);
            setGroupStudentsError(error.message || 'Error de conexión al cargar estudiantes del grupo.');
        } finally {
            setIsLoadingGroupStudents(false);
        }
    };

    const fetchTeachers = async () => {
        setIsLoadingTeachers(true);
        setTeacherFetchError('');
        try {
            const data = await AdminService.getTeachers();
            setTeachersList(data);
        } catch (error) {
            setTeacherFetchError(error.message || 'Error de conexión.');
        } finally {
            setIsLoadingTeachers(false);
            setHasFetchedTeachers(true);
        }
    };

    const fetchAvailableStudents = async () => {
        setIsLoadingAvailableStudents(true);
        try {
            const data = await AdminService.getAvailableStudents();
            setAvailableStudents(data);
        } catch (error) {
            console.error('Error fetching available students:', error);
        } finally {
            setIsLoadingAvailableStudents(false);
            setHasFetchedAvailableStudents(true);
        }
    };

    const openGroupPage = (groupInfo) => {
        setSelectedGroup(groupInfo);
        setActiveGroupView(groupInfo.grade);
        fetchGroupStudents(groupInfo.grade);
    };

    const closeGroupPage = () => {
        setActiveGroupView(null);
        setSelectedGroup(null);
        setGroupStudentsList([]);
        setGroupStudentsError('');
    };

    const closeGroupActionModal = () => {
        setGroupActionModal({ isOpen: false, type: '', targetUser: null });
        setGroupActionTargetGrade('');
        setGroupActionError('');
        setTempSelectedStudents([]);
    };

    const handleGroupActionSubmit = async () => {
        setIsSubmittingAction(true);
        setGroupActionError('');
        try {
            const currentGrade = activeGroupView;
            switch (groupActionModal.type) {
                case 'ADD_TEACHER':
                    if (!groupActionModal.targetUser) throw new Error('Selecciona un maestro.');
                    await AdminService.addTeacherToGroup(currentGrade, groupActionModal.targetUser);
                    break;
                case 'MOVE_TEACHER':
                    if (!groupActionTargetGrade) throw new Error('Selecciona el grupo destino.');
                    await AdminService.moveTeacherToGroup(groupActionTargetGrade, groupActionModal.targetUser);
                    break;
                case 'ADD_STUDENTS':
                    if (tempSelectedStudents.length === 0) throw new Error('Selecciona al menos un estudiante.');
                    await AdminService.addStudentsToGroup(currentGrade, tempSelectedStudents);
                    break;
                case 'MOVE_STUDENT':
                    if (!groupActionTargetGrade) throw new Error('Selecciona el grupo destino.');
                    await AdminService.moveStudentToGroup(groupActionTargetGrade, groupActionModal.targetUser);
                    break;
                default:
                    throw new Error('Acción no válida.');
            }
            fetchGroups();
            if (activeGroupView) fetchGroupStudents(activeGroupView);
            setHasFetchedAvailableStudents(false);
            closeGroupActionModal();
        } catch (error) {
            setGroupActionError(error.message);
        } finally {
            setIsSubmittingAction(false);
        }
    };

    const removeTeacherFromGroup = (teacherUsername, grade) => {
        showAlert({
            mode: 'alert',
            title: 'Remover Maestro',
            message: '¿Estás seguro de remover al maestro de este grupo?',
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: 'Remover',
                    type: 'accept',
                    onClick: async () => {
                        try {
                            await AdminService.removeTeacherFromGroup(grade, teacherUsername);
                            fetchGroups();
                            setSelectedGroup(prev => ({ ...prev, teacher: null }));
                        } catch (error) {
                            showAlert({ mode: 'error', title: 'Error', message: error.message });
                        }
                    }
                }
            ]
        });
    };

    const removeStudentFromGroup = (studentUsername, grade) => {
        showAlert({
            mode: 'alert',
            title: 'Remover Estudiante',
            message: '¿Estás seguro de remover a este estudiante del grupo?',
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: 'Remover',
                    type: 'accept',
                    onClick: async () => {
                        try {
                            await AdminService.removeStudentFromGroup(grade, studentUsername);
                            fetchGroups();
                            fetchGroupStudents(grade);
                            setHasFetchedAvailableStudents(false);
                        } catch (error) {
                            showAlert({ mode: 'error', title: 'Error', message: error.message });
                        }
                    }
                }
            ]
        });
    };

    const advanceYear = () => {
        showAlert({
            mode: 'alert',
            title: 'Avanzar Año Escolar',
            message: 'Todos los grupos avanzarán de grado (1º→2º, 2º→3º, … 5º→6º) y los alumnos de 6º grado se graduarán, quedando el 1er grado vacío. Esta acción no se puede deshacer.',
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: 'Avanzar Grupos',
                    type: 'accept',
                    countdown: 5,
                    onClick: async () => {
                        setIsAdvancingYear(true);
                        try {
                            const result = await AdminService.advanceYear();
                            fetchGroups();
                            showAlert({
                                mode: 'success',
                                title: 'Año Escolar Avanzado',
                                message: `${result.promoted} alumnos promovidos, ${result.graduated} graduados, de ${result.processed} procesados.`
                            });
                        } catch (error) {
                            showAlert({ mode: 'error', title: 'Error', message: error.message || 'No se pudo avanzar el año escolar.' });
                        } finally {
                            setIsAdvancingYear(false);
                        }
                    }
                }
            ]
        });
    };

    const openCreateGroupModal = (gradeLocked = false, gradeVal = '') => {
        setIsGradeLocked(gradeLocked);
        setCreateGroupForm({ grade: gradeVal, teacherUsername: '', studentsUsername: [] });
        setCreateGroupStep('MAIN');
        setCreateGroupError('');
        setIsCreateGroupModalOpen(true);
    };

    const closeCreateGroupModal = () => {
        setIsCreateGroupModalOpen(false);
        setCreateGroupForm({ grade: '', teacherUsername: '', studentsUsername: [] });
        setCreateGroupStep('MAIN');
        setCreateGroupError('');
    };

    const submitCreateGroup = async () => {
        if (!createGroupForm.grade) {
            setCreateGroupError('Selecciona un grado válido.');
            return;
        }
        setIsSubmittingGroup(true);
        setCreateGroupError('');
        try {
            await AdminService.createGroup(createGroupForm.grade, {
                studentsUsername: createGroupForm.studentsUsername,
                teacherUsername: createGroupForm.teacherUsername || null
            });
            fetchGroups();
            setHasFetchedAvailableStudents(false);
            closeCreateGroupModal();
        } catch (error) {
            console.error('Error creating group:', error);
            setCreateGroupError(error.message || 'Ocurrió un error al crear el grupo.');
        } finally {
            setIsSubmittingGroup(false);
        }
    };

    // ─── Render: Group Action Modal ───
    const renderGroupActionModal = () => {
        if (!groupActionModal.isOpen) return null;
        const isMove = groupActionModal.type === 'MOVE_TEACHER' || groupActionModal.type === 'MOVE_STUDENT';
        const isAddStuds = groupActionModal.type === 'ADD_STUDENTS';
        const isAddTeacher = groupActionModal.type === 'ADD_TEACHER';

        return (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col w-full max-w-md animate-slide-up">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined">{isMove ? 'sync_alt' : 'add_circle'}</span>
                            </div>
                            {isMove ? 'Mover de Grupo' : (isAddTeacher ? 'Asignar Maestro' : 'Agregar Estudiantes')}
                        </h3>
                        <button onClick={closeGroupActionModal} className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-xl hover:bg-gray-100">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-6">
                        {groupActionError && (
                            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl mb-4 text-sm animate-pulse flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {groupActionError}
                            </div>
                        )}
                        {isMove && (
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Grupo Destino <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-500 mb-2">Selecciona el grupo al cual deseas mover a {groupActionModal.targetUser}.</p>
                                <select
                                    value={groupActionTargetGrade}
                                    onChange={e => setGroupActionTargetGrade(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                >
                                    <option value="" disabled>Seleccionar grado...</option>
                                    {groupsList.filter(g => g.grade !== activeGroupView).map(g => (
                                        <option key={g.grade} value={g.grade}>{g.grade}º Grado</option>
                                    ))}
                                </select>
                                {groupsList.filter(g => g.grade !== activeGroupView).length === 0 && (
                                    <p className="text-xs text-orange-500 mt-2">No hay otros grupos disponibles a los cuales mover.</p>
                                )}
                            </div>
                        )}
                        {isAddTeacher && (
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Seleccionar Maestro <span className="text-red-500">*</span>
                                </label>
                                {isLoadingTeachers ? (
                                    <p className="text-sm text-gray-500 animate-pulse">Cargando maestros...</p>
                                ) : (
                                    <select
                                        value={groupActionModal.targetUser || ''}
                                        onChange={e => setGroupActionModal(prev => ({ ...prev, targetUser: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    >
                                        <option value="" disabled>Seleccionar maestro...</option>
                                        {teachersList.filter(t => !groupsList.some(g => g.teacher && g.teacher.username === t.username)).map(t => (
                                            <option key={t.username} value={t.username}>{t.lastname}, {t.firstname}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                        {isAddStuds && (
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide flex justify-between">
                                    <span>Estudiantes Disponibles</span>
                                    <span className="text-primary">{tempSelectedStudents.length} seleccionados</span>
                                </label>
                                {isLoadingAvailableStudents ? (
                                    <div className="flex justify-center p-6"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>
                                ) : (
                                    <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                                        {availableStudents.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500 text-sm">No hay estudiantes sin grupo disponibles.</div>
                                        ) : availableStudents.map(st => (
                                            <label key={st.username} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors gap-3">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                    checked={tempSelectedStudents.includes(st.username)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setTempSelectedStudents(prev => [...prev, st.username]);
                                                        else setTempSelectedStudents(prev => prev.filter(u => u !== st.username));
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800 text-sm">{st.lastname}, {st.firstname}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{st.username}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button onClick={closeGroupActionModal} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button
                                onClick={handleGroupActionSubmit}
                                disabled={isSubmittingAction || (isAddStuds && tempSelectedStudents.length === 0) || (isMove && !groupActionTargetGrade) || (isAddTeacher && !groupActionModal.targetUser)}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-primary/20"
                            >
                                {isSubmittingAction ? (<><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Procesando</>) : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render: Group Detail Page ───
    const renderGroupDetailPage = () => {
        if (!selectedGroup) return null;
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Detalles del {activeGroupView}º Grado</h2>
                        <p className="text-gray-500 mt-1">Gestiona los estudiantes y el maestro de este grupo.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">person</span>
                            Maestro Asignado
                        </h4>
                        {selectedGroup.teacher ? (
                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-50 bg-blue-50/20 p-4 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-800 text-lg">{selectedGroup.teacher.lastname}, {selectedGroup.teacher.firstname}</p>
                                    <p className="text-sm text-gray-500 font-mono mt-1">{selectedGroup.teacher.username}</p>
                                </div>
                                <div className="flex flex-row sm:flex-col gap-2">
                                    <button
                                        onClick={() => setGroupActionModal({ isOpen: true, type: 'MOVE_TEACHER', targetUser: selectedGroup.teacher.username })}
                                        className="text-xs px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-primary hover:text-primary transition-colors shadow-sm font-semibold flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">sync_alt</span>Mover
                                    </button>
                                    <button
                                        onClick={() => removeTeacherFromGroup(selectedGroup.teacher.username, activeGroupView)}
                                        className="text-xs px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">person_remove</span>Remover
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_off</span>
                                <p className="text-gray-500 mb-4 text-sm font-medium">Sin maestro asignado</p>
                                <button
                                    onClick={() => {
                                        if (!hasFetchedTeachers) fetchTeachers();
                                        setGroupActionModal({ isOpen: true, type: 'ADD_TEACHER', targetUser: null });
                                    }}
                                    className="px-5 py-2.5 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all text-sm flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                                    Asignar Maestro
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2">Total Alumnos</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-primary leading-none">{selectedGroup.totalStudents || 0}</span>
                            <span className="text-gray-500 font-medium">inscritos</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-100 gap-4">
                        <h4 className="font-bold text-gray-800 text-lg uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">groups</span>Lista de Estudiantes
                        </h4>
                        <button
                            onClick={() => {
                                fetchAvailableStudents();
                                setGroupActionModal({ isOpen: true, type: 'ADD_STUDENTS', targetUser: null });
                            }}
                            className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all text-sm flex items-center gap-2 shadow-md shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">group_add</span>Agregar Estudiantes
                        </button>
                    </div>

                    {isLoadingGroupStudents ? (
                        <div className="flex justify-center p-12">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary/50">progress_activity</span>
                        </div>
                    ) : groupStudentsError ? (
                        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-center font-medium shadow-sm">{groupStudentsError}</div>
                    ) : groupStudentsList.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">group_off</span>
                            No hay estudiantes inscritos en este grupo.
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                            <table className="w-full text-left border-collapse bg-white">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="py-3 px-4 font-bold text-center w-20">Nº Lista</th>
                                        <th className="py-3 px-4 font-bold">Nombre Completo</th>
                                        <th className="py-3 px-4 font-bold">Usuario</th>
                                        <th className="py-3 px-4 font-bold">Contraseña</th>
                                        <th className="py-3 px-4 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {groupStudentsList.map((student, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">{student.listNumber || '-'}</span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-800 font-medium">{student.lastname}, {student.firstname}</td>
                                            <td className="py-3 px-4 text-gray-500 font-mono text-xs">{student.username}</td>
                                            <td className="py-3 px-4 text-gray-500 font-mono text-xs">{student.password || '******'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="inline-flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setGroupActionModal({ isOpen: true, type: 'MOVE_STUDENT', targetUser: student.username })}
                                                        title="Mover de Grupo"
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                                                    </button>
                                                    <button
                                                        onClick={() => removeStudentFromGroup(student.username, activeGroupView)}
                                                        title="Remover del Grupo"
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">person_remove</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ─── Render: Create Group Modal Content ───
    const renderCreateGroupModalContent = () => {
        if (createGroupStep === 'MAIN') {
            const selectedTeacherObj = teachersList.find(t => t.username === createGroupForm.teacherUsername);
            const selectedStudentsCount = createGroupForm.studentsUsername.length;
            return (
                <div className="p-6 overflow-y-auto w-full max-w-2xl max-h-[75vh]">
                    {createGroupError && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl flex gap-3 animate-pulse">
                            <span className="material-symbols-outlined">error</span>
                            <span>{createGroupError}</span>
                        </div>
                    )}
                    <div className="space-y-6">
                        {/* Grade */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                Grado Escolar <span className="text-red-500">*</span>
                            </label>
                            {isGradeLocked ? (
                                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400">lock</span>
                                    {createGroupForm.grade}º Grado
                                </div>
                            ) : (
                                <select
                                    value={createGroupForm.grade}
                                    onChange={(e) => setCreateGroupForm({ ...createGroupForm, grade: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                                >
                                    <option value="" disabled>Seleccionar grado...</option>
                                    {[1, 2, 3, 4, 5, 6].map(num => {
                                        if (groupsList.some(g => g.grade === num)) return null;
                                        return <option key={num} value={num}>{num}º Grado</option>;
                                    })}
                                </select>
                            )}
                        </div>
                        {/* Teacher */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Maestro Asignado</label>
                            {selectedTeacherObj ? (
                                <div className="flex items-center justify-between p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                            {selectedTeacherObj.firstname.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{selectedTeacherObj.lastname}, {selectedTeacherObj.firstname}</p>
                                            <p className="text-xs text-gray-500 font-mono">{selectedTeacherObj.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (teachersList.length === 0 && !hasFetchedTeachers) fetchTeachers();
                                            setCreateGroupStep('SELECT_TEACHER');
                                        }}
                                        className="text-sm px-4 py-2 text-primary hover:bg-blue-100 rounded-lg font-semibold transition-colors"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (teachersList.length === 0 && !hasFetchedTeachers) fetchTeachers();
                                        setCreateGroupStep('SELECT_TEACHER');
                                    }}
                                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 bg-gray-50/50 hover:bg-primary/5"
                                >
                                    <span className="material-symbols-outlined">person_add</span>Seleccionar Maestro
                                </button>
                            )}
                        </div>
                        {/* Students */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Estudiantes ({selectedStudentsCount})
                                </label>
                                <button
                                    onClick={() => {
                                        if (availableStudents.length === 0 && !hasFetchedAvailableStudents) fetchAvailableStudents();
                                        setTempSelectedStudents([...createGroupForm.studentsUsername]);
                                        setCreateGroupStep('SELECT_STUDENTS');
                                    }}
                                    className="text-sm text-primary font-bold hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[18px]">group_add</span>Agregar / Editar
                                </button>
                            </div>
                            {selectedStudentsCount > 0 ? (
                                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                    <ul className="divide-y divide-gray-100 bg-white">
                                        {createGroupForm.studentsUsername.map(username => {
                                            const st = availableStudents.find(s => s.username === username);
                                            return (
                                                <li key={username} className="p-3 flex items-center justify-between hover:bg-gray-50">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{st?.listNumber || '-'}</span>
                                                        <span className="font-medium text-gray-800">{st ? `${st.lastname}, ${st.firstname}` : username}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setCreateGroupForm(prev => ({ ...prev, studentsUsername: prev.studentsUsername.filter(u => u !== username) }))}
                                                        className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                        title="Remover"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">group_off</span>
                                    <p className="text-gray-500 text-sm">No hay estudiantes seleccionados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button onClick={closeCreateGroupModal} className="px-6 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancelar</button>
                        <button
                            onClick={submitCreateGroup}
                            disabled={isSubmittingGroup || !createGroupForm.grade}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-primary/20"
                        >
                            {isSubmittingGroup ? (<><span className="material-symbols-outlined animate-spin align-middle text-[20px]">progress_activity</span>Guardando...</>) : (<><span className="material-symbols-outlined text-[20px]">save</span>Crear Grupo</>)}
                        </button>
                    </div>
                </div>
            );
        }

        if (createGroupStep === 'SELECT_TEACHER') {
            return (
                <div className="flex flex-col h-full max-h-[75vh]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                        <button onClick={() => setCreateGroupStep('MAIN')} className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <h4 className="font-bold text-gray-800">Seleccionar Maestro</h4>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {isLoadingTeachers ? (
                            <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary/50">progress_activity</span></div>
                        ) : teacherFetchError ? (
                            <div className="text-center p-4 bg-red-50 text-red-600 rounded-xl">{teacherFetchError}</div>
                        ) : teachersList.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No hay maestros registrados en el sistema.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {teachersList.map(t => (
                                    <button
                                        key={t.username}
                                        onClick={() => { setCreateGroupForm({ ...createGroupForm, teacherUsername: t.username }); setCreateGroupStep('MAIN'); }}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${createGroupForm.teacherUsername === t.username ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/50 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">{t.firstname.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p className="font-bold text-gray-800">{t.lastname}, {t.firstname}</p>
                                                <p className="text-xs text-gray-500 font-mono">{t.username}</p>
                                            </div>
                                        </div>
                                        {createGroupForm.teacherUsername === t.username && (<span className="material-symbols-outlined text-primary">check_circle</span>)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (createGroupStep === 'SELECT_STUDENTS') {
            const handleToggleStudent = (username) => {
                if (tempSelectedStudents.includes(username)) {
                    setTempSelectedStudents(tempSelectedStudents.filter(u => u !== username));
                } else {
                    setTempSelectedStudents([...tempSelectedStudents, username]);
                }
            };
            return (
                <div className="flex flex-col h-full max-h-[85vh] w-[800px] max-w-full">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCreateGroupStep('MAIN')} className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            </button>
                            <div>
                                <h4 className="font-bold text-gray-800">Seleccionar Estudiantes</h4>
                                <p className="text-xs text-gray-500">{availableStudents.length} disponibles</p>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 shadow-sm">{tempSelectedStudents.length} Seleccionados</div>
                    </div>
                    <div className="p-0 flex-1 overflow-y-auto bg-gray-50/30">
                        {isLoadingAvailableStudents ? (
                            <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary/50">progress_activity</span></div>
                        ) : availableStudents.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">sentiment_dissatisfied</span>
                                No hay estudiantes sin grupo disponibles.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse bg-white shadow-sm">
                                <thead className="sticky top-0 bg-gray-100/95 backdrop-blur z-10 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)]">
                                    <tr className="text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="py-4 px-6 w-12 text-center border-b border-gray-200">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                                                checked={availableStudents.length > 0 && tempSelectedStudents.length === availableStudents.length}
                                                onChange={() => {
                                                    if (tempSelectedStudents.length === availableStudents.length) setTempSelectedStudents([]);
                                                    else setTempSelectedStudents(availableStudents.map(s => s.username));
                                                }}
                                            />
                                        </th>
                                        <th className="py-4 px-6 font-bold border-b border-gray-200">Nº Lista</th>
                                        <th className="py-4 px-6 font-bold border-b border-gray-200">Nombre Completo</th>
                                        <th className="py-4 px-6 font-bold border-b border-gray-200">Usuario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {availableStudents.map(s => (
                                        <tr
                                            key={s.username}
                                            onClick={() => handleToggleStudent(s.username)}
                                            className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${tempSelectedStudents.includes(s.username) ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                                        >
                                            <td className="py-3 px-6 text-center">
                                                <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer pointer-events-none" checked={tempSelectedStudents.includes(s.username)} readOnly />
                                            </td>
                                            <td className="py-3 px-6 text-gray-600 font-medium">{s.listNumber || '-'}</td>
                                            <td className="py-3 px-6 text-gray-800 font-bold">{s.lastname}, {s.firstname}</td>
                                            <td className="py-3 px-6 text-gray-500 font-mono text-sm">{s.username}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 relative">
                        <button onClick={() => setCreateGroupStep('MAIN')} className="px-6 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors">Cancelar</button>
                        <button
                            onClick={() => { setCreateGroupForm({ ...createGroupForm, studentsUsername: tempSelectedStudents }); setCreateGroupStep('MAIN'); }}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">check</span>
                            Confirmar {tempSelectedStudents.length > 0 ? `(${tempSelectedStudents.length})` : ''}
                        </button>
                    </div>
                </div>
            );
        }
        return null;
    };

    // ─── Groups Grid ───
    const gradesList = [1, 2, 3, 4, 5, 6];

    if (activeGroupView !== null) {
        return (
            <div className="relative">
                {renderGroupDetailPage()}
                {renderGroupActionModal()}
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold text-gray-800">Grupos</h2>
                        <button
                            onClick={fetchGroups}
                            disabled={isLoadingGroups}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-primary transition-colors disabled:opacity-50 mt-1"
                            title="Recargar datos"
                        >
                            <span className={`material-symbols-outlined text-xl ${isLoadingGroups ? 'animate-spin' : ''}`}>sync</span>
                        </button>
                    </div>
                    <p className="text-gray-500 mt-1">Gestiona los grupos de la escuela.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={advanceYear}
                        disabled={isAdvancingYear}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isAdvancingYear ? (
                            <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Avanzando...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[18px]">fast_forward</span>Avanzar Grado</>
                        )}
                    </button>
                    <button className="px-5 py-2.5 text-red-500 bg-red-50/50 rounded-xl font-medium hover:bg-red-50 transition-colors cursor-not-allowed opacity-70 flex items-center gap-2" disabled title="Próximamente">
                        <span className="material-symbols-outlined text-[18px]">delete</span>Eliminar
                    </button>
                    <button
                        onClick={() => openCreateGroupModal(false)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl transition-all shadow-md shadow-primary/20 hover:bg-primary-dark hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>Crear Grupo
                    </button>
                </div>
            </div>

            {groupFetchError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-3 shadow-sm animate-pulse">
                    <span className="material-symbols-outlined">error</span>
                    <span className="font-medium">{groupFetchError}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gradesList.map(grade => {
                    if (isLoadingGroups) {
                        return (
                            <div key={grade} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[280px]">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Cargando {grade}º...</p>
                            </div>
                        );
                    }
                    const group = groupsList.find(g => g.grade === grade);
                    if (group) {
                        return (
                            <div key={grade} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 duration-300 h-full group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 text-primary border border-primary/10 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner">{grade}º</div>
                                    <div className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-green-50 text-green-600 border border-green-200/50 text-xs font-bold uppercase rounded-full tracking-wide shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Activo
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4 text-gray-600">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100"><span className="material-symbols-outlined text-gray-400">person</span></div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Maestro Asignado</span>
                                            <span className="font-semibold text-gray-800 text-sm truncate" title={group.teacher ? `${group.teacher.lastname}, ${group.teacher.firstname}` : 'Sin Asignar'}>
                                                {group.teacher ? `${group.teacher.lastname}, ${group.teacher.firstname}` : 'Sin Asignar'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-600">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100"><span className="material-symbols-outlined text-gray-400 text-[22px]">groups</span></div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Estudiantes</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black text-gray-800 text-lg">{group.totalStudents || 0}</span>
                                                <span className="text-gray-500 text-sm font-medium">inscritos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => openGroupPage(group)} className="w-full mt-8 py-3 bg-gray-50 hover:bg-primary text-gray-600 hover:text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/button">
                                    Ver Estudiantes
                                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover/button:translate-x-1">arrow_forward</span>
                                </button>
                            </div>
                        );
                    } else {
                        return (
                            <div key={grade} className="bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center min-h-[294px] transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 group">
                                <div className="w-16 h-16 bg-white text-gray-300 rounded-full flex items-center justify-center text-3xl font-black mb-5 shadow-sm border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-110">{grade}º</div>
                                <h3 className="text-lg font-bold text-gray-400 mb-1">Sin Asignar</h3>
                                <p className="text-sm text-gray-400 text-center mb-8 max-w-[200px] leading-relaxed">No existe un grupo creado para este grado escolar.</p>
                                <button
                                    onClick={() => openCreateGroupModal(true, grade)}
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:text-primary hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 transition-all text-sm flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add_circle</span>Crear Grupo
                                </button>
                            </div>
                        );
                    }
                })}
            </div>

            {/* Create Group Modal */}
            {isCreateGroupModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col w-full max-w-2xl max-h-[90vh] animate-slide-up">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">add_circle</span>
                                </div>
                                Crear Nuevo Grupo
                            </h3>
                            <button onClick={closeCreateGroupModal} className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-xl hover:bg-gray-100">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {renderCreateGroupModalContent()}
                    </div>
                </div>
            )}
        </div>
    );
};

// Export breadcrumb helper for AdminDashboard
export { GroupsSection };
export default GroupsSection;
