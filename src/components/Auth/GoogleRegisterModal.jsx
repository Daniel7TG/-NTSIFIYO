import React, { useEffect, useRef } from 'react';

/**
 * Modal para completar el registro de un usuario nuevo con Google OAuth.
 * Se abre cuando el backend responde 409 CONFLICT al intentar login con Google.
 *
 * Props:
 *  - isOpen: boolean — controla visibilidad del modal
 *  - onClose: () => void — cierra el modal sin registrar
 *  - onSubmit: (e) => void — envía el formulario de registro
 *  - isLoading: boolean — estado de carga del submit
 *  - error: string | null — mensaje de error a mostrar
 *  - fields: { email, firstname, lastname, username, password }
 *  - setters: { setFirstname, setLastname, setUsername, setPassword }
 */
const GoogleRegisterModal = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    error,
    fields,
    setters,
}) => {
    const modalRef = useRef(null);
    const firstInputRef = useRef(null);

    const { email, firstname, lastname, username, password } = fields;
    const { setFirstname, setLastname, setUsername, setPassword } = setters;

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Foco en el primer input editable cuando se abre
    useEffect(() => {
        if (isOpen && firstInputRef.current) {
            setTimeout(() => firstInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Cerrar con tecla Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    // Cerrar al hacer clic fuera del modal
    const handleBackdropClick = (e) => {
        if (e.target === modalRef.current && !isLoading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-register-title"
        >
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-2xl">account_circle</span>
                        <h2
                            id="google-register-title"
                            className="text-lg font-bold text-primary-dark"
                        >
                            Completa tu registro
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        aria-label="Cerrar"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="px-6 py-5 flex flex-col gap-4">
                    <p className="text-sm text-gray-500">
                        Tu cuenta de Google no está registrada aún. Revisa los datos y elige un
                        nombre de usuario y contraseña.
                    </p>

                    {/* Nombres */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-primary-dark">
                                Nombre(s)
                            </label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined text-lg">
                                    badge
                                </span>
                                <input
                                    ref={firstInputRef}
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                    placeholder="Ej. Juan"
                                    value={firstname}
                                    onChange={(e) => setFirstname(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-primary-dark">
                                Apellidos
                            </label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined text-lg">
                                    badge
                                </span>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                    placeholder="Ej. Pérez"
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email (solo lectura) */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-primary-dark">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined text-lg">
                                mail
                            </span>
                            <input
                                type="email"
                                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm outline-none cursor-not-allowed"
                                value={email}
                                disabled
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-primary-dark">
                            Nombre de Usuario <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined text-lg">
                                person
                            </span>
                            <input
                                type="text"
                                className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                placeholder="Ej. juanperez"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-primary-dark">
                            Contraseña <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined text-lg">
                                lock
                            </span>
                            <input
                                type="password"
                                className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            <span className="material-symbols-outlined text-lg shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm ${
                                isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary-dark'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">
                                        progress_activity
                                    </span>
                                    <span>Creando cuenta...</span>
                                </>
                            ) : (
                                <>
                                    <span>Crear Cuenta</span>
                                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full py-2.5 text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoogleRegisterModal;
