import apiConfig from './apiConfig';

let onUnauthorized;
beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('authToken', 'current-token');
    onUnauthorized = jest.fn();
    window.addEventListener('sessionUnauthorized', onUnauthorized);
});
afterEach(() => window.removeEventListener('sessionUnauthorized', onUnauthorized));
const errorResponse = (status) => ({ ok: false, status, json: async () => ({ message: 'Fallo' }) });

it('notifica el rechazo del token actual por una petición protegida', async () => {
    await expect(apiConfig.handleResponse(errorResponse(401), 'current-token')).rejects.toThrow('Fallo');
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized.mock.calls[0][0].detail.token).toBe('current-token');
});

it.each([403, 500])('no cierra la sesión por un error %s', async (status) => {
    await expect(apiConfig.handleResponse(errorResponse(status), 'current-token')).rejects.toThrow('Fallo');
    expect(onUnauthorized).not.toHaveBeenCalled();
});

it('ignora rechazos de peticiones anteriores o sin token', async () => {
    await expect(apiConfig.handleResponse(errorResponse(401), 'previous-token')).rejects.toThrow();
    await expect(apiConfig.handleResponse(errorResponse(401))).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
});
