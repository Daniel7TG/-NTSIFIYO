import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import PageShell from '../../components/common/PageShell';
import StatsCards from '../../components/Dashboard/StatsCards';
import NextLessonCard from '../../components/Dashboard/NextLessonCard';
import CurrentProgress from '../../components/Dashboard/CurrentProgress';
import TopLearners from '../../components/Dashboard/TopLearners';
import SectionHeader from '../../components/common/SectionHeader';
import { useAuth } from '../../context/AuthContext';
import { useStudentDashboardQuery, useStudentInvalidate } from '../../hooks/useStudentQueries';

/**
 * Dashboard principal del estudiante.
 * Usa TanStack Query: los datos se cargan una sola vez y se mantienen
 * en caché (staleTime: Infinity). El botón "Actualizar" llama a invalidateQueries.
 */
const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data, isLoading, error } = useStudentDashboardQuery();
    const { reloadDashboard } = useStudentInvalidate();

    const {
        level = 1,
        experience = 0,
        inrow = 0,
        finished = 0,
        pending = [],
        classmates = []
    } = data || {};

    return (
        <PageShell>
            <SectionHeader
                title={`¡Bienvenido de nuevo, ${user?.firstname || user?.username}!`}
                subtitle="Continuemos tu camino para dominar el idioma Mazahua. ¡Lo estás haciendo muy bien!"
                onReload={reloadDashboard}
            />

            <button
                onClick={() => navigate('/estudiante/mapa')}
                className="w-full mb-8 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E65100] via-[#FF8F00] to-[#FFA726] p-1 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
                <div className="flex items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-[#E65100] via-[#FF8F00] to-[#FFA726] px-6 py-5">
                    <span className="material-symbols-outlined text-4xl text-white drop-shadow-lg animate-bounce">sports_esports</span>
                    <span className="text-2xl font-extrabold text-white tracking-wide drop-shadow-md">¡JUGAR!</span>
                    <span className="material-symbols-outlined text-3xl text-white drop-shadow-lg transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                </div>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>

            {isLoading && <LoadingState message="Cargando tu progreso..." />}

            {error && !isLoading && (
                <ErrorState
                    message={error.message}
                    onRetry={reloadDashboard}
                    dashboardPath={null}
                />
            )}

            {!isLoading && !error && data && (
                <>
                    {/* Stats Cards */}
                    <section className="mb-8">
                        <StatsCards
                            level={level}
                            experience={experience}
                            inrow={inrow}
                            finished={finished}
                        />
                    </section>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - 2/3 width */}
                        <div className="lg:col-span-2 space-y-6">
                            <NextLessonCard pendingActivities={pending} />
                        </div>

                        {/* Right Column - 1/3 width */}
                        <div className="space-y-6">
                            <CurrentProgress experience={experience} level={level} />
                            <TopLearners learners={classmates} currentUserName={user?.username} />
                        </div>
                    </div>
                </>
            )}
        </PageShell>
    );
};

export default StudentDashboard;
