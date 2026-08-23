import React, { useState } from 'react';
import Breadcrumb from './Breadcrumb';
import '../../styles/components/common/SectionHeader.css';


/**
 * SectionHeader — Encabezado reutilizable para secciones de contenido.
 *
 * Props:
 *   title          {string}    — Título principal
 *   subtitle       {string}    — Subtítulo opcional
 *   onReload       {function}  — Callback al presionar el ícono de recarga; si no se pasa, el ícono no aparece
 *   showBreadcrumb {boolean}   — Mostrar el breadcrumb (default: true)
 *   actionButton   {node}      — Botón de acción opcional (ej: "Crear nuevo")
 */
const SectionHeader = ({
    title,
    subtitle,
    onReload,
    showBreadcrumb = true,
    actionButton = null,
}) => {
    const [spinning, setSpinning] = useState(false);

    const handleReload = async () => {
        if (spinning || !onReload) return;
        setSpinning(true);
        try {
            await onReload();
        } finally {
            setTimeout(() => setSpinning(false), 600);
        }
    };

    return (
        <div className="section-header">
            {showBreadcrumb && <Breadcrumb />}

            <div className="section-header__content">
                <div className="section-header__title-row">
                    {title && <h1 className="section-header__title">{title}</h1>}
                    <div className="section-header__actions">
                        {onReload && (
                            <button
                                className="section-header__sync-btn"
                                onClick={handleReload}
                                disabled={spinning}
                                title="Recargar"
                                aria-label="Recargar contenido"
                            >
                                <span className={`material-symbols-outlined section-header__sync-icon${spinning ? ' section-header__sync-icon--spinning' : ''}`}>
                                    sync
                                </span>
                            </button>
                        )}
                        {actionButton}
                    </div>
                </div>
                {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
            </div>
        </div>
    );
};

export default SectionHeader;
