import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import Roles from '../utils/roles';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import GoogleLoginButton from '../components/Auth/GoogleLoginButton';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showAlert } = useAlert();
    const [authMode, setAuthMode] = useState(location.state?.mode || 'login');
    const [userType, setUserType] = useState('student');
    const [isLoading, setIsLoading] = useState(false);

    // Estados para el login del estudiante
    const [listNumber, setListNumber] = useState('');
    const [studentPassword, setStudentPassword] = useState('');
    const [grade, setGrade] = useState('');
    const [studentLoginError, setStudentLoginError] = useState('');

    // Estados para login de maestro/visitante
    const [teacherUsername, setTeacherUsername] = useState('');
    const [guestUsername, setGuestUsername] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [password, setPassword] = useState('');
    const [standardLoginError, setStandardLoginError] = useState('');

    // Estados para registro de visitante
    const [registerFirstname, setRegisterFirstname] = useState('');
    const [registerLastname, setRegisterLastname] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Validar formato de email
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Grados disponibles
    const grades = [
        { value: '1', label: '1º Primero' },
        { value: '2', label: '2º Segundo' },
        { value: '3', label: '3º Tercero' },
        { value: '4', label: '4º Cuarto' },
        { value: '5', label: '5º Quinto' },
        { value: '6', label: '6º Sexto' }
    ];

    // Validar antes de enviar
    const handleStudentLogin = () => {
        if (!listNumber.trim()) {
            setStudentLoginError('Por favor ingresa tu número de lista');
            return false;
        }
        if (!studentPassword.trim()) {
            setStudentLoginError('Por favor ingresa tu contraseña');
            return false;
        }
        if (!grade) {
            setStudentLoginError('Por favor selecciona tu grado');
            return false;
        }
        return true;
    };

    // Formatea el mensaje de error del backend, convirtiendo milisegundos a segundos
    const formatErrorMessage = (message) => {
        if (!message) return message;
        // Buscar patrones como "30000ms" o "30000 millis" o "espera 30000" y convertir a segundos
        const msMatch = message.match(/(\d{4,})\s*(?:ms|millis|milisegundos?)/i);
        if (msMatch) {
            const ms = parseInt(msMatch[1], 10);
            const seconds = Math.ceil(ms / 1000);
            return message.replace(/\d{4,}\s*(?:ms|millis|milisegundos?)/i, `${seconds} segundos`);
        }
        // Si el mensaje tiene un número grande que parece milisegundos (>= 10000) seguido de "segundos"
        const secMatch = message.match(/(\d{4,})\s*segundos?/i);
        if (secMatch) {
            const likelyMs = parseInt(secMatch[1], 10);
            if (likelyMs >= 10000) {
                const seconds = Math.ceil(likelyMs / 1000);
                return message.replace(/\d{4,}\s*segundos?/i, `${seconds} segundos`);
            }
        }
        return message;
    };

    const onSuccess = async (response, role) => {
        const jwtToken = response.data.jwtToken;
        const userData = {
            firstname: response.data?.firstname || response.data?.firstName || '',
            lastname: response.data?.lastname || response.data?.lastName || '',
            userType: role,
        };
        login(userData, jwtToken);
        await UserService.startSession();
        window.dispatchEvent(new Event('authChanged'));

    }

    useEffect(() => {
        if (location.state?.mode) setAuthMode(location.state.mode);
    }, [location.state]);

    return (
        <div className="flex min-h-screen w-full flex-row overflow-hidden bg-white">
            {/* PANEL IZQUIERDO: Visual (Se mantiene igual) */}
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

            {/* PANEL DERECHO: Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md flex flex-col gap-8">

                    {/* Toggle Login/Register */}
                    <div className="bg-orange-50 p-1.5 rounded-xl flex w-full border border-primary/10">
                        <button onClick={() => setAuthMode('login')} className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Iniciar Sesión</button>
                        <button onClick={() => { setAuthMode('register'); setUserType('guest'); }} className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Registrarse</button>
                    </div>

                    {registerSuccess ? (
                        <div className="flex flex-col gap-2 text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                            </div>
                            <h2 className="text-3xl font-bold text-primary-dark tracking-tight">¡Registro exitoso!</h2>
                            <p className="text-gray-500">
                                Hemos enviado un enlace de verificación a tu correo electrónico.
                                Por favor revisa tu bandeja de entrada (y spam) para activar tu cuenta.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-primary-dark tracking-tight">{authMode === 'login' ? '¡Hola de nuevo!' : 'Crea una cuenta'}</h2>
                            <p className="text-gray-500">{userType === 'student' ? 'Ingresa tu número de lista y contraseña para entrar.' : 'Nos alegra verte otra vez.'}</p>
                        </div>
                    )}

                    {registerSuccess && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm text-center">
                                <span className="material-symbols-outlined align-middle mr-1">info</span>
                                No cierres esta página hasta verificar tu correo. Si no encuentras el email, espera unos minutos o revisa la carpeta de spam.
                            </div>
                            <button
                                onClick={() => {
                                    setRegisterSuccess(false);
                                    setAuthMode('login');
                                    setStandardLoginError('');
                                }}
                                className="w-full py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                            >
                                <span>Ir al Inicio de Sesión</span>
                                <span className="material-symbols-outlined">login</span>
                            </button>
                        </div>
                    )}

                    {!registerSuccess && (
                        <>
                            {authMode === 'login' && (
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-semibold text-primary-dark pl-1">Soy un...</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['student', 'teacher', 'guest'].map((type) => (
                                            <button key={type} onClick={() => setUserType(type)} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all h-28 ${userType === type ? 'border-primary bg-orange-50' : 'border-transparent bg-white shadow-sm hover:border-primary/30'}`}>
                                                <span className={`material-symbols-outlined text-3xl ${userType === type ? 'text-primary' : 'text-gray-400'}`}>{type === 'student' ? 'face' : type === 'teacher' ? 'school' : 'person'}</span>
                                                <span className="text-xs font-medium text-primary-dark">{type === 'student' ? 'Niño' : type === 'teacher' ? 'Maestro' : 'Visitante'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* FORMULARIO DINÁMICO */}
                            <div className="flex flex-col gap-6">
                                {userType === 'student' && authMode === 'login' ? (
                            /* --- LOGIN DEL ESTUDIANTE --- */
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Campo de Número de Lista */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-primary-dark uppercase tracking-wider">Tu Número de Lista</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 text-gray-400 material-symbols-outlined">tag</span>
                                        <input
                                            type="number"
                                    className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-2xl text-lg font-medium text-center text-primary-dark focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-gray-300 ${studentLoginError ? 'border-red-300' : 'border-orange-100'}`}
                                            placeholder="Ej. 15"
                                            value={listNumber}
                                            onChange={(e) => setListNumber(e.target.value)}
                                            min="1"
                                            max="99"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 pl-1">Tu número asignado en el grupo</p>
                                </div>

                                {/* Campo de Contraseña */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-primary-dark uppercase tracking-wider">Tu Contraseña</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 text-gray-400 material-symbols-outlined">lock</span>
                                        <input
                                            type="password"
                                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-orange-100 rounded-2xl text-lg font-medium text-primary-dark focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                                            placeholder="••••••••"
                                            value={studentPassword}
                                            onChange={(e) => setStudentPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Selector de Grado */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-primary-dark uppercase tracking-wider">Tu Grado Escolar</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 text-gray-400 material-symbols-outlined">school</span>
                                        <select
                                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-orange-100 rounded-2xl text-lg font-medium text-primary-dark focus:border-primary focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                        >
                                            <option value="" disabled>Selecciona tu grado...</option>
                                            {grades.map((g) => (
                                                <option key={g.value} value={g.value}>{g.label}</option>
                                            ))}
                                        </select>
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 pr-4 flex items-center text-gray-400 material-symbols-outlined pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                {/* Mensaje de Error */}
                                {studentLoginError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        <span className="material-symbols-outlined text-lg">error</span>
                                        <span>{formatErrorMessage(studentLoginError)}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* --- LOGIN / REGISTRO ESTÁNDAR --- */
                            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                                {authMode === 'register' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-primary-dark">Nombre(s)</label>
                                                <div className="relative">
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined">badge</span>
                                                    <input
                                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                        placeholder="Ej. Maria"
                                                        type="text"
                                                        value={registerFirstname}
                                                        onChange={(e) => setRegisterFirstname(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-primary-dark">Apellidos</label>
                                                <div className="relative">
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined">badge</span>
                                                    <input
                                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                        placeholder="Ej. Gonzalez"
                                                        type="text"
                                                        value={registerLastname}
                                                        onChange={(e) => setRegisterLastname(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-primary-dark">Nombre de Usuario</label>
                                            <div className="relative">
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined">person</span>
                                                <input
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    placeholder="Ej. maria_gonzalez"
                                                    type="text"
                                                    value={registerUsername}
                                                    onChange={(e) => setRegisterUsername(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Usuario para Login (Maestro/Visitante), Email para Registro (Visitante) */}
                                {authMode === 'login' ? (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-primary-dark">Usuario</label>
                                        <div className="relative">
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined">person</span>
                                            <input
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                placeholder={userType === 'teacher' ? "Ej. maestro.gonzalez" : "Ej. visitante123"}
                                                type="text"
                                                value={userType === 'teacher' ? teacherUsername : guestUsername}
                                                onChange={(e) => userType === 'teacher' ? setTeacherUsername(e.target.value) : setGuestUsername(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-primary-dark">Correo Electrónico</label>
                                        <div className="relative">
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-3 text-gray-400 material-symbols-outlined">mail</span>
                                            <input
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                placeholder="nombre@ejemplo.com"
                                                type="email"
                                                value={guestEmail}
                                                onChange={(e) => setGuestEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

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

                                {/* Mensaje de Error para Login/Registro estándar */}
                                {standardLoginError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        <span className="material-symbols-outlined text-lg">error</span>
                                        <span>{formatErrorMessage(standardLoginError)}</span>
                                    </div>
                                )}
                            </form>
                        )}

                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={async () => {
                                setIsLoading(true);
                                setStudentLoginError('');
                                setStandardLoginError('');

                                try {
                                    // Si es estudiante y está haciendo login
                                    if (authMode === 'login' && userType === 'student') {
                                        if (!handleStudentLogin()) {
                                            setIsLoading(false);
                                            return;
                                        }

                                        const response = await AuthService.login({
                                            listNumber: parseInt(listNumber),
                                            password: studentPassword,
                                            userType: Roles.STUDENT,
                                            grade: parseInt(grade)
                                        });

                                        if (response.success) {
                                            onSuccess(response, Roles.STUDENT)
                                            navigate('/estudiante/dashboard');
                                        } else {
                                            setStudentLoginError(response.error || 'Error al iniciar sesión');
                                        }
                                    } else if (authMode === 'login' && userType === 'teacher') {
                                        if (!teacherUsername || !password) {
                                            setStandardLoginError('Por favor completa todos los campos');
                                            setIsLoading(false);
                                            return;
                                        }

                                        const response = await AuthService.login({
                                            username: teacherUsername,
                                            password: password,
                                            userType: Roles.TEACHER
                                        });

                                        if (response.success) {
                                            onSuccess(response, Roles.TEACHER)
                                            navigate('/maestro/dashboard');
                                        } else {
                                            setStandardLoginError(response.error || 'Credenciales incorrectas');
                                        }
                                    } else if (authMode === 'login' && userType === 'guest') {
                                        if (!guestUsername || !password) {
                                            setStandardLoginError('Por favor completa todos los campos');
                                            setIsLoading(false);
                                            return;
                                        }

                                        const response = await AuthService.login({
                                            username: guestUsername,
                                            password: password,
                                            userType: Roles.VISITOR
                                        });

                                        if (response.success) {
                                            onSuccess(response, Roles.VISITOR)
                                            navigate('/estudiante/dashboard');
                                        } else {
                                            const errMsg = (response.error || '').toLowerCase();
                                            if (errMsg.includes('verifica') || errMsg.includes('verificar') || errMsg.includes('email no verificado') || response.status === 403) {
                                                setStandardLoginError('Tu correo electrónico aún no ha sido verificado. Revisa tu bandeja de entrada o solicita un nuevo enlace de verificación.');
                                            } else {
                                                setStandardLoginError(response.error || 'Credenciales incorrectas');
                                            }
                                        }
                                    } else if (authMode === 'register') {
                                        // Registro de visitante
                                        if (!registerFirstname || !registerLastname || !guestEmail || !password || !registerUsername) {
                                            setStandardLoginError('Por favor completa todos los campos');
                                            setIsLoading(false);
                                            return;
                                        }

                                        if (!isValidEmail(guestEmail)) {
                                            setStandardLoginError('Por favor ingresa un correo electrónico válido');
                                            setIsLoading(false);
                                            return;
                                        }

                                        const response = await AuthService.registerVisitor({
                                            firstname: registerFirstname.trim(),
                                            lastname: registerLastname.trim(),
                                            email: guestEmail,
                                            password: password,
                                            username: registerUsername
                                        });

                                        if (response.success) {
                                            setRegisterSuccess(true);
                                            setStandardLoginError('');
                                        } else {
                                            setStandardLoginError(response.error || 'Error al crear cuenta');
                                        }
                                    }
                                } catch (error) {
                                    const isStudent = authMode === 'login' && userType === 'student';
                                    if (isStudent) {
                                        setStudentLoginError('Error de conexión. Intenta de nuevo.');
                                    } else {
                                        setStandardLoginError('Error de conexión. Intenta de nuevo.');
                                    }
                                    console.error('Login error:', error);
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className={`w-full mt-4 py-4 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-lg ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Cargando...</span>
                                </>
                            ) : (
                                <>
                                    <span>{authMode === 'login' ? '¡Entrar a Clase!' : 'Crear Cuenta'}</span>
                                    <span className="material-symbols-outlined">rocket_launch</span>
                                </>
                            )}
                        </button>
                    </div>

                    {authMode === 'login' && userType === 'guest' && (
                        <>
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-sm text-gray-400">O continúa con</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>
                            <GoogleLoginButton />
                        </>
                    )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;