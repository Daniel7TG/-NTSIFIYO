import React from 'react';
import ReactDOM from 'react-dom/client';
import './tailwind.output.css'; // CSS compilado con Tailwind CLI

// Fuentes locales
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/public-sans/300.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";


import App from './App'; // Llama al componente principal

import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { GameProvider } from './context/GameContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * QueryClient global de TanStack Query.
 * - staleTime: Infinity  → los datos nunca se consideran "viejos" automáticamente;
 *   solo se refrescan cuando el usuario pulsa "Actualizar" (invalidateQueries).
 * - gcTime: 15 min      → los datos sin suscriptores se eliminan de la caché
 *   después de 15 minutos de inactividad.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            gcTime: 1000 * 60 * 15,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Crea la raíz del sitio vinculándola al div 'root' del index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderiza la aplicación dentro del modo estricto de React
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AlertProvider>
                    <GameProvider>
                        <App />
                    </GameProvider>
                </AlertProvider>
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>
);