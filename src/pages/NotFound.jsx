import React from 'react';
import { Link } from 'react-router-dom';
export default function NotFound() {
    return <main className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Página no encontrada</h1>
        <p className="mb-6">La dirección que abriste no existe.</p>
        <Link to="/" className="text-primary underline">Volver al inicio</Link>
    </main>;
}
