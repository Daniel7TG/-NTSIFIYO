// client/src/components/common/AppErrorBoundary.jsx
// Barrera de errores global: evita que una excepción de render deje
// la página en blanco/trabada. Se resetea automáticamente al navegar.
import React from 'react';
import { useLocation } from 'react-router-dom';

class ErrorBoundaryInner extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('Error capturado por AppErrorBoundary:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: 'calc(100vh - 64px)',
                    fontFamily: 'Poppins, sans-serif', padding: '2rem', textAlign: 'center'
                }}>
                    <span style={{ fontSize: '56px', marginBottom: '1rem' }}>😵</span>
                    <h2 style={{ color: '#1E3A8A', fontSize: '22px', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Algo salió mal
                    </h2>
                    <p style={{ color: '#6B7280', maxWidth: '420px', marginBottom: '1.5rem' }}>
                        Ocurrió un error inesperado. Intenta volver atrás o recargar la página.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => { this.setState({ hasError: false }); window.history.back(); }}
                            style={{
                                background: '#1E3A8A', color: '#fff', border: 'none',
                                borderRadius: '10px', padding: '0.75rem 1.5rem',
                                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                            }}
                        >
                            Volver atrás
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'transparent', color: '#1E3A8A', border: '2px solid #1E3A8A',
                                borderRadius: '10px', padding: '0.75rem 1.5rem',
                                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                            }}
                        >
                            Recargar
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// key={location.pathname}: al navegar a otra ruta la barrera se remonta
// y limpia el estado de error automáticamente
const AppErrorBoundary = ({ children }) => {
    const location = useLocation();
    return <ErrorBoundaryInner key={location.pathname}>{children}</ErrorBoundaryInner>;
};

export default AppErrorBoundary;
