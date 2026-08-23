import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

/**
 * VerifyEmailPage — Pantalla de verificación de correo electrónico.
 * Lee el token de la URL y lo envía al backend para activar la cuenta.
 */
const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [errorType, setErrorType] = useState(''); // 'expired' | 'invalid' | 'network'

    useEffect(() => {
        // Validar formato básico del token (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!token || !uuidRegex.test(token)) {
            setStatus('error');
            setErrorType('invalid');
            return;
        }

        const doVerify = async () => {
            try {
                const result = await AuthService.verifyEmail(token);
                if (result.success) {
                    setStatus('success');
                } else {
                    const msg = result.error?.toLowerCase() || '';
                    if (msg.includes('expirado') || msg.includes('expired') || result.status === 410) {
                        setErrorType('expired');
                    } else {
                        setErrorType('invalid');
                    }
                    setStatus('error');
                }
            } catch {
                setStatus('error');
                setErrorType('network');
            }
        };

        doVerify();
    }, [token]);

    const renderContent = () => {
        if (status === 'loading') {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium tracking-wide">Verificando tu correo electrónico...</p>
                </div>
            );
        }

        if (status === 'success') {
            return (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Correo verificado!</h2>
                    <p className="text-gray-500 mb-8">
                        Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión.
                    </p>
                    <button
                        onClick={() => navigate('/auth', { state: { mode: 'login' } })}
                        className="w-full py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                    >
                        Ir al Inicio de Sesión
                    </button>
                </div>
            );
        }

        // Error states
        let title = 'Error de verificación';
        let message = 'No pudimos verificar tu correo electrónico.';
        let icon = 'error';
        let iconColor = 'text-red-600';
        let bgColor = 'bg-red-100';

        if (errorType === 'expired') {
            title = 'Enlace expirado';
            message = 'El enlace de verificación ha expirado. Solicita uno nuevo registrándote nuevamente o contactando soporte.';
            icon = 'schedule';
        } else if (errorType === 'network') {
            title = 'Error de conexión';
            message = 'No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.';
            icon = 'wifi_off';
        }

        return (
            <div className="text-center py-8">
                <div className={`w-16 h-16 ${bgColor} ${iconColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <span className="material-symbols-outlined text-4xl">{icon}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-500 mb-8">{message}</p>
                <button
                    onClick={() => navigate('/auth', { state: { mode: 'login' } })}
                    className="w-full py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all mb-3"
                >
                    Ir al Inicio de Sesión
                </button>
                <button
                    onClick={() => navigate('/auth', { state: { mode: 'register' } })}
                    className="w-full py-3 bg-white border-2 border-primary text-primary font-bold rounded-2xl hover:bg-orange-50 transition-all"
                >
                    Crear nueva cuenta
                </button>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-white">
            {/* Panel izquierdo visual */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-dark flex-col justify-center items-center p-12 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                    style={{ backgroundImage: "url('../../../public_html/media/images/Traditional Hungarian Patterns.jpeg')" }}
                ></div>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary-dark/80 via-primary-dark/20 to-transparent"></div>
                <div className="relative z-20 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-4xl">language</span>
                        <h3 className="text-white text-xl font-bold uppercase tracking-widest">NTS'I FÍYO</h3>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">Preserva el patrimonio.<br />Habla el futuro.</h1>
                </div>
            </div>

            {/* Panel derecho */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-2 text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold text-primary-dark tracking-tight">Verificación de Correo</h2>
                        <p className="text-gray-500">Estamos confirmando tu dirección de correo electrónico.</p>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
