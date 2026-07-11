import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import AdminLogin from './pages/AdminLogin';
import apiConfig from './services/apiConfig';

import { useAuth } from './context/AuthContext';
import { useAlert } from './context/AlertContext';
import { CoyoteProvider } from './context/CoyoteContext';

import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import DashboardSwitcher from './components/Dashboard/DashboardSwitcher';
import Roles from './utils/roles';

// Lazy-loaded components (loaded on demand)
const ConfigurationGameView = lazy(() => import('./components/Teacher/ConfigurationGameView'));
const GameAccessView = lazy(() => import('./components/Games/GameAccessView'));
const MemoriaRapidaGameView = lazy(() => import('./components/Games/MemoriaRapida/MemoriaRapidaGameView'));
const QuizGameView = lazy(() => import('./components/Games/Quiz/QuizGameView'));
const IntrusoGameView = lazy(() => import('./components/Games/Intruso/IntrusoGameView'));
// const RompecabezasGameView = lazy(() => import('./components/Games/Rompecabezas/RompecabezasGameView'));
const ParesGameView = lazy(() => import('./components/Games/Pares/ParesGameView'));
const MemoramaGameView = lazy(() => import('./components/Games/Memorama/MemoramaGameView'));
const LoteriaGameView = lazy(() => import('./components/Games/Loteria/LoteriaGameView'));
const LaberintoGameView = lazy(() => import('./components/Games/Laberinto/LaberintoGameView'));
const TripasGameView = lazy(() => import('./components/Games/Tripas/TripasGameView'));
const SopaLetrasGameView = lazy(() => import('./components/Games/SopaLetras/SopaLetrasGameView'));
const FillBlankGameView = lazy(() => import('./components/Games/FillBlank/FillBlankGameView'));
const ContentSection = lazy(() => import('./pages/common/ContentSection'));
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'));
const MediaPlayerView = lazy(() => import('./components/common/MediaPlayerView'));
const StudentActivities = lazy(() => import('./pages/student/StudentActivities'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
const GameMap = lazy(() => import('./components/Map/GameMap'));
const TeacherResources = lazy(() => import('./pages/teacher/TeacherResources'));
const TeacherStudents = lazy(() => import('./pages/teacher/TeacherStudents'));
const TeacherAssignments = lazy(() => import('./pages/teacher/TeacherAssignments'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMediaCreate = lazy(() => import('./pages/admin/AdminMediaCreate'));
const TeacherContent = lazy(() => import('./pages/teacher/TeacherContent'));
const DictionaryPage = lazy(() => import('./pages/common/DictionaryPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

/**
 * Wrapper that adds top-padding equal to the fixed navbar height (64px = h-16)
 * on every page EXCEPT the home page, where the hero is intentionally fullscreen.
 */
// Loading fallback for lazy-loaded components
function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );
}

function PageContent({ children }) {
    const location = useLocation();
    const isHome = location.pathname === '/';
    return (
        <div className={isHome ? '' : 'pt-16'}>
            {children}
        </div>
    );
}

function App() {
    const { user, isAuthenticated, sessionExpired, clearSessionExpired } = useAuth();
    const queryClient = useQueryClient();
    const { showAlert } = useAlert();

    // El token guardado ya no sirve (GET /api/user/me devolvió 403): la sesión quedó
    // cerrada en AuthContext, aquí solo se limpia la caché de datos del usuario anterior
    // y se avisa. Las rutas protegidas redirigen solas a /auth vía ProtectedRoute.
    useEffect(() => {
        if (!sessionExpired) return;
        queryClient.clear();
        clearSessionExpired();
        showAlert({
            mode: 'alert',
            title: 'Sesión finalizada',
            message: 'Tu sesión expiró o ya no es válida. Vuelve a iniciar sesión para continuar.',
            buttons: [{ text: 'Entendido', type: 'accept' }],
        });
    }, [sessionExpired, clearSessionExpired, queryClient, showAlert]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                fetch(`${apiConfig.baseUrl}/api/user/session/end`, {
                    method: 'PUT',
                    headers: apiConfig.getHeaders(),
                    keepalive: true
                }).catch(console.error);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <CoyoteProvider>
        <Router>
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark">
                <Navbar />
                <PageContent>
                <AppErrorBoundary>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/nosotros" element={
                        <Suspense fallback={<LoadingFallback />}>
                            <NosotrosPage />
                        </Suspense>
                    } />
                    <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
                    <Route path="/registro" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/admin" element={!isAuthenticated ? <AdminLogin /> : <Navigate to="/dashboard" replace />} />

                    {/* Authenticated Layout */}
                    <Route element={<MainLayout user={user} />}>

                        {/* Dynamic Dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute isAllowed={isAuthenticated}>
                                    <DashboardSwitcher role={user?.userType} />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route element={<ProtectedRoute isAllowed={isAuthenticated && user?.userType === Roles.ADMIN} />}>
                            <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/admin/grupos" element={<AdminDashboard />} />
                            <Route path="/admin/estudiantes" element={<AdminDashboard />} />
                            <Route path="/admin/maestros" element={<AdminDashboard />} />
                            <Route path="/admin/palabras" element={<AdminDashboard />} />
                            <Route path="/admin/actividades" element={<AdminDashboard />} />
                            <Route path="/admin/actividades/crear" element={
                                <ConfigurationGameView redirectPath="/admin/actividades" />
                            } />
                            <Route path="/admin/actividades/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/admin/actividades" />
                            } />
                            <Route path="/admin/contenido" element={<ContentSection createRoute="/admin/contenido/crear" />} />
                            <Route path="/admin/contenido/crear" element={<AdminMediaCreate />} />
                        </Route>

                        {/* Teacher Routes */}
                        <Route element={<ProtectedRoute isAllowed={isAuthenticated && user?.userType === Roles.TEACHER} />}>
                                <Route path="/maestro/dashboard" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/maestro/estudiantes" element={<TeacherStudents />} />
                                <Route path="/maestro/asignaciones" element={<TeacherAssignments />} />
                                <Route path="/maestro/recursos" element={<TeacherResources />} />
                                <Route path="/maestro/contenido" element={<ContentSection />} />
                                <Route path="/maestro/diccionario" element={<DictionaryPage />} />

                                <Route path="/maestro/recursos/crear" element={
                                    <ConfigurationGameView redirectPath="/maestro/recursos" />
                                } />
                                <Route path="/maestro/recursos/editar/:editId" element={
                                    <ConfigurationGameView redirectPath="/maestro/recursos" />
                                } />
                        </Route>

                        {/* Student Routes */}
                        <Route element={<ProtectedRoute isAllowed={isAuthenticated && user?.userType === Roles.STUDENT} />}>
                            <Route path="/estudiante/dashboard" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/estudiante/actividades" element={<StudentActivities />} />
                            <Route path="/estudiante/mapa" element={<GameMap />} />
                            <Route path="/estudiante/asignaciones" element={<StudentAssignments />} />
                            <Route path="/estudiante/contenido" element={<ContentSection />} />
                            <Route path="/estudiante/diccionario" element={<DictionaryPage />} />
                        </Route>

                        {/* Visitor Routes */}
                        <Route element={<ProtectedRoute isAllowed={isAuthenticated && user?.userType === Roles.VISITOR} />}>
                            <Route path="/visitante/dashboard" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/visitante/mapa" element={<GameMap />} />
                            <Route path="/visitante/actividades" element={<StudentActivities />} />
                            <Route path="/visitante/contenido" element={<ContentSection />} />
                            <Route path="/visitante/diccionario" element={<DictionaryPage />} />
                        </Route>

                        {/* Games/Global Authenticated Routes */}
                        <Route element={<ProtectedRoute isAllowed={isAuthenticated} />}>
                            {/* MediaPlayer */}
                            <Route path="/reproductor/:id" element={<MediaPlayerView />} />

                            {/* Generic Game Access View */}
                            <Route path="/games/:gameId" element={<GameAccessView />} />

                            {/* Memoria Rápida */}
                            <Route path="/games/memoria_rapida/crear" element={
                                <ConfigurationGameView redirectPath="/games/memoria_rapida/jugar/{id}" />
                            } />
                            <Route path="/games/memoria_rapida/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/games/memoria_rapida" />
                            } />
                            <Route path="/games/memoria_rapida/jugar/:activityId" element={
                                <MemoriaRapidaGameView studentId={localStorage.getItem('app_user') ? JSON.parse(localStorage.getItem('app_user')).id : 'student_001'} />
                            } />

                            {/* Memorama */}
                            <Route path="/games/memorama/crear" element={
                                <ConfigurationGameView redirectPath="/games/memorama/jugar/{id}" />
                            } />
                            <Route path="/games/memorama/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/games/memorama" />
                            } />
                            <Route path="/games/memorama/jugar/:activityId" element={
                                <MemoramaGameView studentId={localStorage.getItem('app_user') ? JSON.parse(localStorage.getItem('app_user')).id : 'student_001'} />
                            } />

                            {/* Quiz */}
                            <Route path="/games/quiz/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/games/quiz" />
                            } />
                            <Route path="/games/quiz/jugar/:activityId" element={<QuizGameView />} />

                            {/* Intruso */}
                            <Route path="/games/intruso/jugar/:activityId" element={<IntrusoGameView />} />

                            {/* Rompecabezas */}
                            {/* <Route path="/games/rompecabezas/jugar/:activityId" element={<RompecabezasGameView />} /> */}

                            {/* Pares */}
                            <Route path="/games/pares/crear" element={
                                <ConfigurationGameView redirectPath="/games/pares/jugar/{id}" />
                            } />
                            <Route path="/games/pares/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/games/pares" />
                            } />
                            <Route path="/games/pares/jugar/:activityId" element={<ParesGameView />} />

                            {/* Lotería */}
                            <Route path="/games/loteria/jugar/:activityId" element={<LoteriaGameView />} />

                            {/* Laberinto */}
                            <Route path="/games/laberinto/jugar/:activityId" element={<LaberintoGameView />} />

                            {/* Tripas del Gato */}
                            <Route path="/games/tripas/crear" element={
                                <ConfigurationGameView redirectPath="/games/tripas/jugar/{id}" />
                            } />
                            <Route path="/games/tripas/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/games/tripas" />
                            } />
                            <Route path="/games/tripas/jugar/:activityId" element={<TripasGameView />} />

                            {/* Sopa de Letras */}
                            <Route path="/games/encuentra_palabra/crear" element={
                                <ConfigurationGameView redirectPath="/games/encuentra_palabra/jugar/{id}" />
                            } />
                            <Route path="/games/encuentra_palabra/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/games/encuentra_palabra" />
                            } />
                            <Route path="/games/encuentra_palabra/jugar/:activityId" element={<SopaLetrasGameView />} />

                            {/* Fill Blank */}
                            <Route path="/games/fill_blank/crear" element={
                                <ConfigurationGameView redirectPath="/games/fill_blank/jugar/{id}" />
                            } />
                            <Route path="/games/fill_blank/editar/:editId" element={
                                <ConfigurationGameView redirectPath="/games/fill_blank" />
                            } />
                            <Route path="/games/fill_blank/jugar/:activityId" element={<FillBlankGameView />} />
                        </Route>
                    </Route>

                </Routes>
                </AppErrorBoundary>
                </PageContent>
            </div>
        </Router>
        </CoyoteProvider>
    );
}

export default App;