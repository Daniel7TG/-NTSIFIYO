import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideBar from '../Dashboard/SideBar';
import { BreadcrumbProvider } from '../../context/BreadcrumbContext';
import { useCoyote } from '../../context/CoyoteContext';
import CoyoteCompanion from '../common/CoyoteCompanion';
import Roles from '../../utils/roles';

/**
 * Layout principal de la aplicación autenticada.
 * Incluye la configuración global del SideBar y el contenedor del contenido principal.
 * @param {Object} user - Objeto de usuario actual.
 */
const MainLayout = ({ user }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { speak, setPosition } = useCoyote();

    // Check if the current route is a game route where we want a full-screen experience
    const isGameRoute = (location.pathname.includes('/games/') && location.pathname.includes('/jugar/')) ||
        location.pathname.includes('/recursos/crear') ||
        location.pathname.includes('/recursos/editar');

    useEffect(() => {
        const handleToggle = () => setIsSidebarOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-sidebar', handleToggle);
    }, []);

    useEffect(() => {
        const isPlayingGame = location.pathname.includes('/games/') && location.pathname.includes('/jugar/');
        setPosition('left');

        const ROUTE_MESSAGES = {
            '/estudiante/dashboard': { text: '¡Hola! Aquí puedes ver tus progresos y actividades diarias.', emotion: 'saludo' },
            '/estudiante/mapa': { text: '¡Este es tu mapa de aventuras! Elige una estación para jugar.', emotion: 'esperando' },
            '/estudiante/asignaciones': { text: 'Revisa las tareas que te asignaron tus profesores. ¡Vamos a completarlas!', emotion: 'pensando' },
            '/estudiante/actividades': { text: '¿Qué juego prefieres hoy? ¡Todos te dan puntos de experiencia!', emotion: 'saludo' },
            '/estudiante/diccionario': { text: '¡El diccionario mágico! Busca palabras en mazahua para expandir tu vocabulario.', emotion: 'pensando' },
            '/visitante/dashboard': { text: '¡Bienvenido! Explora los juegos de Mazahua Connect y diviértete aprendiendo.', emotion: 'saludo' },
        };

        if (isPlayingGame) {
            const gameType = location.pathname.split('/')[2];
            let instruction = '';
            
            switch (gameType) {
                case 'memoria_rapida':
                    instruction = '¡Rápido! Desliza la carta a la derecha (o toca ✓) si coincide con la palabra de arriba, o a la izquierda (o ✕) si es diferente.';
                    break;
                case 'memorama':
                    instruction = 'Voltea las cartas de dos en dos para encontrar los pares ocultos. ¡Pon a prueba tu memoria!';
                    break;
                case 'quiz':
                    instruction = 'Lee con atención y elige la respuesta correcta entre las opciones disponibles.';
                    break;
                case 'intruso':
                    instruction = 'Observa bien el grupo de cartas y selecciona la única que NO pertenece a la familia o es diferente.';
                    break;
                case 'pares':
                    instruction = 'Selecciona una carta de la izquierda y luego su pareja en la derecha para unirlas.';
                    break;
                case 'loteria':
                    instruction = 'Presta atención a las cartas que van saliendo y márcalas en tu tablero si las tienes. ¡Llena el tablero!';
                    break;
                case 'laberinto':
                    instruction = '¡Guía a tu personaje por el laberinto hasta encontrar la respuesta correcta sin chocar!';
                    break;
                case 'tripas':
                    instruction = 'Une con una línea las parejas correctas. ¡Pero mucho cuidado, las líneas no pueden cruzarse!';
                    break;
                case 'encuentra_palabra':
                    instruction = 'Busca las palabras escondidas en la sopa de letras. ¡Pueden estar en cualquier dirección!';
                    break;
                case 'fill_blank':
                    instruction = 'Observa la oración incompleta y selecciona la palabra correcta para llenarla.';
                    break;
                default:
                    instruction = '¡Demuestra todo lo que has aprendido! Completa la actividad para ganar puntos.';
            }
            
            speak(instruction, 'pensando');
        } else {
            const match = ROUTE_MESSAGES[location.pathname];
            if (match) {
                speak(match.text, match.emotion);
            }
        }
    }, [location.pathname, speak, setPosition]);

    if (!user) return <Outlet />; // Fallback si no hay usuario

    const isAdminOrTeacher = user.userType === Roles.ADMIN || user.userType === Roles.TEACHER;
    const bgClass = !isGameRoute && isAdminOrTeacher
        ? 'bg-gray-50'
        : 'bg-gradient-to-b from-background-start to-background-end';

    return (
        <BreadcrumbProvider>
            <div className={`min-h-[calc(100vh-4rem)] ${bgClass} flex relative w-full overflow-x-hidden`}>
                {(user.userType === Roles.STUDENT || user.userType === Roles.VISITOR) && (
                    <CoyoteCompanion />
                )}
                {/* Sidebar global de la aplicación, hidden on game routes */}
                {!isGameRoute && (
                    <SideBar
                        role={user.userType}
                        userName={user.firstname || 'Usuario'}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Overlay para móviles */}
                {!isGameRoute && isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Contenedor principal de vistas (Outlet) */}
                <main className={`flex-1 min-w-0 ${!isGameRoute ? 'lg:pl-64' : ''}`}>
                    <Suspense fallback={
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        </div>
                    }>
                        <div key={location.pathname}>
                            <Outlet />
                        </div>
                    </Suspense>
                </main>
            </div>
        </BreadcrumbProvider>
    );
};

export default MainLayout;
