import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import Roles from '../utils/roles';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        setIsLoading(true);
        try {
            const response = await AuthService.login({
                username: username,
                password: password,
                userType: Roles.ADMIN // Se enviará a /api/auth/login/admin
            });

            if (response.success) {
                const jwtToken = response.data.jwtToken;
                const userData = {
                    firstname: response.data?.firstname || response.data?.firstName || '',
                    lastname: response.data?.lastname || response.data?.lastName || '',
                    userType: Roles.ADMIN,
                };
                login(userData, jwtToken);

                await UserService.startSession();
                window.dispatchEvent(new Event('authChanged'));
                navigate('/admin/dashboard');
            } else {
                setError(response.error || 'Credenciales incorrectas');
            }
        } catch (err) {
            setError('Error de conexión. Intenta de nuevo.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-white">
            {/* PANEL IZQUIERDO: Visual (Similar al AuthPage principal) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary-dark flex-col justify-center items-center p-12 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                    style={{ backgroundImage: "url('../../../public_html/media/images/Traditional Hungarian Patterns.jpeg')" }}
                ></div>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary-dark/80 via-primary-dark/20 to-transparent"></div>
                <div className="relative z-20 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-4xl">settings</span>
                        <h3 className="text-white text-xl font-bold uppercase tracking-widest">ADMINISTRACIÓN</h3>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">Acceso<br />Restringido.</h1>
                </div>
            </div>

            {/* PANEL DERECHO: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md flex flex-col gap-8">

                    <div className="flex flex-col gap-2 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-primary-dark tracking-tight">Portal de Administrador</h2>
                        <p className="text-gray-500">Ingresa tus credenciales para continuar.</p>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-primary-dark">Usuario Administrador</label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined">person</span>
                                <input
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Ej. admin_root"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-primary-dark">Contraseña</label>
                            <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined">lock</span>
                                <input
                                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="••••••••"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                <span className="material-symbols-outlined text-lg">error</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full mt-4 py-4 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-lg ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Entrar al Sistema</span>
                                </>
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
