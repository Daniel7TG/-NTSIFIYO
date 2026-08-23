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
                className="w-full mb-8 group relative overflow-hidden rounded-[24px] bg-[#FF9800] border-3 border-[#E65100] shadow-[0_6px_0_#C2410C] hover:shadow-[0_8px_0_#C2410C] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_#C2410C] transition-all duration-150"
            >
                <div className="flex items-center justify-center gap-4 px-6 py-5">
                    <span className="material-symbols-outlined text-4xl text-white drop-shadow-[0_2px_0_#C2410C] animate-bounce">sports_esports</span>
                    <span className="text-2xl font-black text-white tracking-wider drop-shadow-[0_2px_0_#C2410C]">¡JUGAR AL MAPA!</span>
                    <span className="material-symbols-outlined text-3xl text-white drop-shadow-[0_2px_0_#C2410C] transition-transform duration-300 group-hover:translate-x-2">arrow_forward</span>
                </div>
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
