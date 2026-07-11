import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import UserService from '../../services/UserService';
import AvatarCard from './AvatarCard';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { AVATARS } from '../../config/avatars';
import '../../styles/components/common/AvatarPicker.css';

// Los 20 avatares se reparten en dos anillos concéntricos alrededor del actual.
const INNER_COUNT  = 8;
const INNER_RADIUS = 118;
const OUTER_RADIUS = 196;

const OPTION_SIZE = 62;
const CENTER_SIZE = 132;

/** Posición (x, y) en px respecto al centro del ruedo. */
const ringPosition = (index) => {
    const inInner = index < INNER_COUNT;
    const radius  = inInner ? INNER_RADIUS : OUTER_RADIUS;
    const count   = inInner ? INNER_COUNT : AVATARS.length - INNER_COUNT;
    const slot    = inInner ? index : index - INNER_COUNT;
    // Arranca arriba (-90°) y reparte el resto del anillo en partes iguales.
    const angle   = (-90 + (360 / count) * slot) * (Math.PI / 180);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

/**
 * AvatarPicker — muestra el avatar actual; al abrirlo despliega los demás en círculo
 * a su alrededor. Guarda con PUT /api/user/avatar (solo STUDENT y VISITOR).
 *
 * @param {number} [props.size]  Diámetro del avatar en la vista compacta (px)
 */
const AvatarPicker = ({ size = 96 }) => {
    const { user, updateUser } = useAuth();
    const { showAlert }        = useAlert();

    const [open,     setOpen]     = useState(false);
    const [savingId, setSavingId] = useState(null);

    const currentId = Number.isInteger(user?.avatarId) ? user.avatarId : 0;

    // El avatar no viene en el login ni en /api/user/me: se pide aparte la primera vez.
    useEffect(() => {
        if (Number.isInteger(user?.avatarId)) return;
        let cancelled = false;
        (async () => {
            const result = await UserService.getAvatar();
            if (!cancelled && result.success && Number.isInteger(result.avatarId)) {
                updateUser({ avatarId: result.avatarId });
            }
        })();
        return () => { cancelled = true; };
    }, [user?.avatarId, updateUser]);

    // Cierra con Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const handleSelect = async (avatarId) => {
        if (savingId !== null) return;
        if (avatarId === currentId) { setOpen(false); return; }

        setSavingId(avatarId);
        const result = await UserService.updateAvatar(avatarId);
        setSavingId(null);

        if (!result.success) {
            showAlert({
                mode: 'error',
                title: 'No se pudo cambiar el avatar',
                message: result.status === 403
                    ? 'Tu cuenta no puede cambiar de avatar.'
                    : (result.error || 'Inténtalo de nuevo.'),
            });
            return;
        }

        updateUser({ avatarId: result.avatarId });
        setOpen(false);
    };

    // El sidebar tiene `transform`, y eso convierte a sus hijos `position: fixed` en
    // relativos a él: el ruedo quedaba encerrado ahí. Se monta en <body> con un portal.
    const overlay = (
        <div
            className="avatar-picker-overlay"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Elige tu avatar"
        >
            <div className="avatar-picker-stage" onClick={(e) => e.stopPropagation()}>
                <p className="avatar-picker-hint">Elige tu avatar</p>

                {/* Avatar actual, al centro */}
                <div className="avatar-picker-center">
                    <AvatarCard avatarId={currentId} size={CENTER_SIZE} alt="Avatar actual" ring={false} />
                </div>

                {/* Los demás, en círculo alrededor */}
                {AVATARS.map(({ avatarId }, index) => {
                    const { x, y }   = ringPosition(index);
                    const isCurrent  = avatarId === currentId;
                    const isSaving   = savingId === avatarId;
                    const isDisabled = savingId !== null && !isSaving;

                    return (
                        <button
                            key={avatarId}
                            type="button"
                            onClick={() => handleSelect(avatarId)}
                            disabled={isDisabled}
                            className={`avatar-picker-option${isCurrent ? ' is-current' : ''}${isSaving ? ' is-saving' : ''}`}
                            style={{
                                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                                animationDelay: `${index * 22}ms`,
                            }}
                            title={`Avatar ${avatarId + 1}`}
                            aria-label={`Avatar ${avatarId + 1}`}
                            aria-pressed={isCurrent}
                        >
                            <AvatarCard avatarId={avatarId} size={OPTION_SIZE} alt="" ring={false} />
                            {isSaving && (
                                <span className="avatar-picker-spinner material-symbols-outlined">progress_activity</span>
                            )}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="avatar-picker-close"
                    aria-label="Cerrar"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Vista compacta */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="avatar-picker-trigger"
                title="Cambiar avatar"
                aria-label="Cambiar avatar"
            >
                <AvatarCard avatarId={currentId} size={size} alt="Tu avatar" ring={false} />
                <span className="avatar-picker-edit material-symbols-outlined">edit</span>
            </button>

            {/* Ruedo de avatares — fuera del sidebar, sobre toda la página */}
            {open && createPortal(overlay, document.body)}
        </>
    );
};

export default AvatarPicker;
