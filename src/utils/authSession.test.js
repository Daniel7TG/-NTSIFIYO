import { readJwtClaims, readStoredSession } from './authSession';

const jwt = (claims) => `header.${btoa(JSON.stringify(claims))}.signature`;

beforeEach(() => localStorage.clear());

it('restaura el usuario del login y recupera el username del JWT', () => {
    const token = jwt({ sub: 'teacher', exp: Date.now() / 1000 + 3600 });
    localStorage.setItem('authToken', token);
    localStorage.setItem('appUser', JSON.stringify({ firstname: 'Profesor', userType: 'TEACHER', grade: 3 }));
    expect(readStoredSession()).toEqual({
        token, invalid: false,
        user: { firstname: 'Profesor', userType: 'TEACHER', grade: 3, username: 'teacher' },
    });
});

it('rechaza un token vencido', () => {
    localStorage.setItem('authToken', jwt({ sub: 'teacher', exp: Date.now() / 1000 - 1 }));
    localStorage.setItem('appUser', JSON.stringify({ userType: 'TEACHER' }));
    expect(readStoredSession()).toEqual({ user: null, token: null, invalid: true });
});

it('tolera localStorage dañado sin romper la aplicación', () => {
    localStorage.setItem('authToken', jwt({ sub: 'teacher', exp: Date.now() / 1000 + 3600 }));
    localStorage.setItem('appUser', '{invalid');
    expect(readStoredSession().invalid).toBe(true);
});

it.each([null, 'bad-token', jwt({ sub: 'teacher' }), jwt({ exp: 12345 })])(
    'rechaza un JWT incompleto o mal formado: %s', (token) => {
        expect(readJwtClaims(token)).toBeNull();
    },
);

it('no restaura un usuario sin token', () => {
    localStorage.setItem('appUser', JSON.stringify({ userType: 'TEACHER' }));
    expect(readStoredSession().user).toBeNull();
});
