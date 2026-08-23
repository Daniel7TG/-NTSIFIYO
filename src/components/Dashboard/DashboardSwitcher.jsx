import React from 'react';
import Roles from '../../utils/roles';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import TeacherDashboard from '../../pages/teacher/TeacherDashboard';
import StudentDashboard from '../../pages/student/StudentDashboard';
import VisitorDashboard from '../../pages/visitor/VisitorDashboard';

/**
 * Componente que renderiza dinámicamente el dashboard correspondiente según el rol.
 * @param {string} role - El rol del usuario actual.
 */
const DashboardSwitcher = ({ role }) => {
    switch (role) {
        case Roles.ADMIN:
            return <AdminDashboard />;
        case Roles.TEACHER:
            return <TeacherDashboard />;
        case Roles.VISITOR:
            return <VisitorDashboard />;
        case Roles.STUDENT:
        default:
            return <StudentDashboard />;
    }
};

export default DashboardSwitcher;
