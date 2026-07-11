import React, { useState } from 'react';
import '../styles/components/nosotros/NosotrosPage.css';

/* ══════════════════════════════════════════════════════════
   DATOS – colaboradores del proyecto por categoría
   ══════════════════════════════════════════════════════════ */

const sections = [
    {
        id: 'maestros',
        icon: 'school',
        label: 'Maestros y adultos hablantes',
        color: '#10B981',
        gradient: 'linear-gradient(135deg, #10B98122 0%, #a7f3d022 100%)',
        border: '#10B981',
        description: 'Maestros bilingües y adultos de la comunidad que grabaron historias y validaron el contenido lingüístico.',
        members: [
            { name: 'Pascuala Catarino Benítez', role: 'Ayudó con las grabaciones de palabras, cuentos, canciones, leyendas y anécdotas, aportando escritura y pronunciación.' },
            { name: 'Norma Guzmán De Jesús', role: 'Ayudó con las grabaciones de palabras, cuentos, canciones, leyendas y anécdotas, aportando escritura y pronunciación.' },
            { name: 'Marcos Medina Mercado', role: 'Ayudó con las grabaciones de palabras, cuentos, canciones, leyendas y anécdotas, aportando escritura y pronunciación.' },
            { name: 'Antonio Reyes Rivera', role: 'Ayudó con las grabaciones de palabras, cuentos, canciones, leyendas y anécdotas, aportando escritura y pronunciación.' },
            { name: 'Matilde Hernández Rodríguez', role: 'Ayudó con las grabaciones de palabras, cuentos, canciones, leyendas y anécdotas, aportando escritura y pronunciación.' },
            { name: 'Efraín García González', role: 'Ayudó con las grabaciones de palabras, cuentos, canciones, leyendas y anécdotas, aportando escritura y pronunciación.' },
            { name: 'Rufino Benítez Reyna', role: 'Ayudó con las grabaciones de palabras, cuentos, canciones, leyendas y anécdotas, aportando escritura y pronunciación.' },
        ],
    },
    {
        id: 'ninos',
        icon: 'child_care',
        label: 'Niños que prestaron sus voces',
        color: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B22 0%, #fde68a22 100%)',
        border: '#F59E0B',
        description: 'Pequeños que grabaron palabras, frases y canciones en Mazahua para dar vida a los juegos.',
        members: [
            { name: 'Alejandro Temoxtle', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Harley Contreras', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Valentina Salcedo', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Sofía García', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Erick Mondragón', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Daiana Flores', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Santiago Salguero', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Omar Báez', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Yedán Domínguez', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Lenin Mejía', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Zoe García', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
            { name: 'Kevin Colín', role: 'Ayudó con la pronunciación de palabras para el modelo de reconocimiento de voz.' },
        ],
    },
    {
        id: 'desarrolladores',
        icon: 'code',
        label: 'Desarrolladores',
        color: '#6C63FF',
        gradient: 'linear-gradient(135deg, #6C63FF22 0%, #a78bfa22 100%)',
        border: '#6C63FF',
        description: 'El equipo que diseñó, programó y dio vida a esta plataforma educativa.',
        members: [
            { name: 'Marín Nava Miguel Yaimine', role: 'Desarrollador' },
            { name: 'Gonzales Ramírez Claudia Teresa', role: 'Desarrolladora' },
            { name: 'Ruiz Villaverde Heidi Naomi', role: 'Desarrolladora' },
            { name: 'Torres Guido Oscar Daniel', role: 'Desarrollador' },
        ],
    },
    {
        id: 'colaboradores',
        icon: 'diversity_3',
        label: 'Otros colaboradores',
        color: '#EC4899',
        gradient: 'linear-gradient(135deg, #EC489922 0%, #fbcfe822 100%)',
        border: '#EC4899',
        description: 'Personas de la comunidad y organizaciones que compartieron historias, canciones y materiales culturales.',
        members: [],
    },
];

/* ══════════════════════════════════════════════════════════
   COMPONENTE TARJETA DE MIEMBRO
   ══════════════════════════════════════════════════════════ */
const MemberCard = ({ name, role, color }) => (
    <div
        className="nosotros-member-card"
        style={{ '--accent': color }}
    >
        <div className="nosotros-member-avatar" style={{ background: color + '22', color }}>
            {name.charAt(0)}
        </div>
        <div className="nosotros-member-info">
            <p className="nosotros-member-name">{name}</p>
            <p className="nosotros-member-role">{role}</p>
        </div>
    </div>
);

/* ══════════════════════════════════════════════════════════
   COMPONENTE SECCIÓN
   ══════════════════════════════════════════════════════════ */
const Section = ({ section }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <section
            id={section.id}
            className="nosotros-section"
            style={{ '--section-color': section.color, '--section-gradient': section.gradient, '--section-border': section.border }}
        >
            {/* Header */}
            <button
                className="nosotros-section-header"
                onClick={() => setExpanded(e => !e)}
                aria-expanded={expanded}
            >
                <div className="nosotros-section-icon-wrap" style={{ background: section.color + '20', color: section.color }}>
                    <span className="material-symbols-outlined nosotros-section-icon">{section.icon}</span>
                </div>
                <div className="nosotros-section-title-group">
                    <h2 className="nosotros-section-title">{section.label}</h2>
                    <p className="nosotros-section-desc">{section.description}</p>
                </div>
                <span
                    className="material-symbols-outlined nosotros-chevron"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    expand_more
                </span>
            </button>

            {/* Members grid */}
            {expanded && (
                <div className="nosotros-members-grid">
                    {section.members.length > 0 ? (
                        section.members.map((m, i) => (
                            <MemberCard key={i} {...m} color={section.color} />
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic py-4">Próximamente se listarán los participantes de esta categoría.</p>
                    )}
                </div>
            )}
        </section>
    );
};

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ══════════════════════════════════════════════════════════ */
const NosotrosPage = () => {
    return (
        <div className="nosotros-page">
            {/* ── Hero ── */}
            <div className="nosotros-hero">
                <div className="nosotros-hero-glow nosotros-hero-glow-left" />
                <div className="nosotros-hero-glow nosotros-hero-glow-right" />

                <div className="nosotros-hero-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>favorite</span>
                    Hecho con amor por la comunidad
                </div>

                <h1 className="nosotros-hero-title">
                    Quiénes somos
                </h1>
                <p className="nosotros-hero-subtitle">
                    Nts'i Fíyo es un proyecto colectivo. Detrás de cada palabra, juego y sonido
                    hay personas reales que creyeron en la preservación de la lengua Mazahua.
                </p>

                {/* Contador de contribuyentes */}
                <div className="nosotros-stats">
                    {sections.map(s => (
                        <div key={s.id} className="nosotros-stat">
                            <span className="nosotros-stat-number" style={{ color: s.color }}>
                                {s.members.length}
                            </span>
                            <span className="nosotros-stat-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Secciones ── */}
            <div className="nosotros-sections-container">
                {sections.map(s => (
                    <Section key={s.id} section={s} />
                ))}
            </div>

            {/* ── Cierre ── */}
            <div className="nosotros-footer-note">
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#6C63FF', opacity: 0.6 }}>auto_stories</span>
                <p>
                    Este proyecto fue posible gracias al apoyo de la Escuela primaria bilingüe de manzanillos, Zitácuaro.
                </p>
            </div>
        </div>
    );
};

export default NosotrosPage;
