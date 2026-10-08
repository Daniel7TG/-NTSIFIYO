// Estos datos permiten restaurar la UI; el backend sigue validando la firma del JWT.
export function readJwtClaims(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='));
        const json = decodeURIComponent(Array.from(decoded, char =>
            `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
        const claims = JSON.parse(json);
        return typeof claims.sub === 'string' && claims.sub
            && typeof claims.exp === 'number' && Number.isFinite(claims.exp) ? claims : null;
    } catch {
        return null;
    }
}

export function readStoredSession() {
    const token = localStorage.getItem('authToken');
    const claims = readJwtClaims(token);
    try {
        const user = JSON.parse(localStorage.getItem('appUser'));
        if (user?.userType && claims && claims.exp * 1000 > Date.now()) {
            return { user: { ...user, username: claims.sub }, token, invalid: false };
        }
    } catch {
        // Un almacenamiento dañado se trata como una sesión que debe iniciarse de nuevo.
    }
    return { user: null, token: null, invalid: Boolean(token) };
}
