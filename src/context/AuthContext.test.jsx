import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserService from '../services/UserService';
import { AuthProvider, useAuth } from './AuthContext';

jest.mock('../services/UserService', () => ({ startSession: jest.fn().mockResolvedValue({ success: true }), endSession: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('../services/GoogleAuthService', () => ({ disableAutoSelect: jest.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;

let root, host, client, auth;
const jwt = (sub, seconds = 3600) => `header.${btoa(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + seconds }))}.signature`;
function Consumer() {
    auth = useAuth();
    return <span>{auth.user?.username || 'sin sesión'}</span>;
}
async function mount() {
    await act(async () => root.render(
        <QueryClientProvider client={client}><AuthProvider><Consumer /></AuthProvider></QueryClientProvider>,
    ));
}

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    global.fetch = jest.fn();
});
afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    host.remove();
    jest.useRealTimers();
    delete global.fetch;
});

it('restaura la sesión sin ninguna consulta de perfil', async () => {
    localStorage.setItem('authToken', jwt('teacher'));
    localStorage.setItem('appUser', JSON.stringify({ firstname: 'Profesor', userType: 'TEACHER' }));
    await mount();
    expect(auth.isAuthenticated).toBe(true);
    expect(host.textContent).toBe('teacher');
    expect(JSON.parse(localStorage.getItem('appUser')).username).toBe('teacher');
    expect(fetch).not.toHaveBeenCalled();
});

it('cierra una sesión guardada con JWT vencido', async () => {
    localStorage.setItem('authToken', jwt('teacher', -1));
    localStorage.setItem('appUser', JSON.stringify({ userType: 'TEACHER' }));
    await mount();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.sessionExpired).toBe(true);
    expect(localStorage.getItem('authToken')).toBeNull();
});

it('caduca automáticamente la sesión abierta', async () => {
    await mount();
    await act(async () => auth.login({ userType: 'TEACHER' }, jwt('teacher', 2)));
    expect(auth.isAuthenticated).toBe(true);
    await act(async () => jest.advanceTimersByTime(2000));
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.sessionExpired).toBe(true);
});

it('descarta la caché del usuario anterior al iniciar otra sesión', async () => {
    await mount();
    client.setQueryData(['teacher', 'dashboard'], { groupId: 99 });
    await act(async () => auth.login({ userType: 'TEACHER' }, jwt('other-teacher')));
    expect(auth.user.username).toBe('other-teacher');
    expect(client.getQueryData(['teacher', 'dashboard'])).toBeUndefined();
});

it('cierra la sesión ante un 401 del token actual e ignora respuestas de otra sesión', async () => {
    await mount();
    const token = jwt('teacher');
    await act(async () => auth.login({ userType: 'TEACHER' }, token));
    await act(async () => window.dispatchEvent(new CustomEvent('sessionUnauthorized', { detail: { token: 'old-token' } })));
    expect(auth.isAuthenticated).toBe(true);
    await act(async () => window.dispatchEvent(new CustomEvent('sessionUnauthorized', { detail: { token } })));
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.sessionExpired).toBe(true);
});

it('espera el cierre del backend antes de borrar el token y la caché', async () => {
    await mount();
    const token = jwt('teacher');
    await act(async () => auth.login({ userType: 'TEACHER' }, token));
    let finish;
    UserService.endSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    let closing;
    await act(async () => { closing = auth.logout(); });
    expect(UserService.endSession).toHaveBeenCalledWith(token);
    expect(localStorage.getItem('authToken')).toBe(token);
    expect(auth.isAuthenticated).toBe(true);
    await act(async () => { finish({ success: true }); await closing; });
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
});

it('el cierre anterior no borra una sesión nueva', async () => {
    await mount();
    await act(async () => auth.login({ userType: 'TEACHER' }, jwt('teacher')));
    let finish;
    UserService.endSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    let closing;
    await act(async () => { closing = auth.logout(); });
    const newToken = jwt('other-teacher');
    await act(async () => auth.login({ userType: 'TEACHER' }, newToken));
    await act(async () => { finish({ success: true }); await closing; });
    expect(localStorage.getItem('authToken')).toBe(newToken);
    expect(auth.user.username).toBe('other-teacher');
});
