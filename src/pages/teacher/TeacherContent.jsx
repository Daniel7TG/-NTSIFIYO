import React from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../../components/common/SectionHeader';
import PageShell from '../../components/common/PageShell';
import IconConstruction from '../../assets/svgs/construction.svg';

/**
 * Vista de 'Contenido' del Maestro
 * Por ahora es un placeholder con la misma estructura y diseño de las demás vistas de maestro.
 */
const TeacherContent = () => {
    return (
        <PageShell>
            <SectionHeader
                        title="Contenido del Curso"
                        subtitle="Gestiona la estructura de los temas, lecciones y materiales teóricos."
                    />

                    {/* Placeholder Content */}
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <img src={IconConstruction} alt="En construcción" className="w-24 h-24 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Sección en Construcción</h3>
                        <p className="text-gray-500 mb-6">
                            Próximamente podrás estructurar aquí el contenido teórico para tus estudiantes.
                        </p>
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Volver al Dashboard
                        </Link>
                    </div>
        </PageShell>
    );
};

export default TeacherContent;
