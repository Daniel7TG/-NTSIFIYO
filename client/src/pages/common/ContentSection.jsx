import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaService, { ContentType } from '../../services/MediaService';
import SectionHeader from '../../components/common/SectionHeader';
import LoadingState from '../../components/common/LoadingState';
import { darken } from '../../utils/colorUtils';
import '../../styles/components/common/contentSectionStyles.css';

import IconPoemas from '../../assets/svgs/diccionario/topic_poemas.svg';
import IconLeyendas from '../../assets/svgs/diccionario/topic_leyendas.svg';
import IconAnecdotas from '../../assets/svgs/diccionario/topic_anecdotas.svg';
import IconCanciones from '../../assets/svgs/diccionario/topic_canciones.svg';

const TABS = [
    { id: ContentType.POEMAS, label: 'Poemas', icon: IconPoemas, color: '#f59e0b' },
    { id: ContentType.LEYENDAS, label: 'Leyendas', icon: IconLeyendas, color: '#7c3aed' },
    { id: ContentType.CUENTOS, label: 'Cuentos', icon: IconAnecdotas, color: '#059669' },
    { id: ContentType.CANCIONES, label: 'Canciones', icon: IconCanciones, color: '#db2777' }
];

const ContentSection = ({ createRoute }) => {
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const navigate = useNavigate();

    const activeColor = TABS.find(t => t.id === activeTab)?.color || '#E65100';

    useEffect(() => {
        setLoading(true);
        MediaService.getMediaByType(activeTab)
            .then(data => {
                if (Array.isArray(data)) setMediaItems(data);
                else if (data && Array.isArray(data.mediaList)) setMediaItems(data.mediaList);
                else if (data && Array.isArray(data.data)) setMediaItems(data.data);
                else setMediaItems([]);
            })
            .catch(err => {
                console.error("Error fetching media:", err);
                setMediaItems([]);
            })
            .finally(() => setLoading(false));
    }, [activeTab]);

    const handlePlay = (item) => {
        navigate(`/reproductor/${item.id}`, {
            state: {
                allowSpanishToggle: true,
                title: item.title,
                overviewImage: item.overviewImage,
                mediaType: item.mediaType
            }
        });
    };

    return (
        <div className="w-full flex-1 relative min-h-screen">
            <div className="w-full">
                <div className="max-w-6xl mx-auto p-8">
                    <div className="content-section-container">
                        <SectionHeader
                            title="Explorar Contenido"
                            subtitle="Descubre y aprende con material multimedia en mazahua."
                        />
                        {createRoute && (
                            <div className="mb-6 flex justify-end">
                                <button className="btn-create-media" onClick={() => navigate(createRoute)}>
                                    <span className="material-symbols-outlined">add_circle</span>
                                    Crear Contenido
                                </button>
                            </div>
                        )}

                        <div className="content-tabs">
                            {TABS.map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`content-tab ${isActive ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={isActive ? {
                                            background: tab.color,
                                            borderColor: darken(tab.color, 0.15),
                                            boxShadow: `0 4px 0 ${darken(tab.color, 0.32)}`
                                        } : { color: tab.color }}
                                    >
                                        <img src={tab.icon} alt="" className="tab-icon-svg" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="content-grid">
                            {loading ? (
                                <div className="col-span-full">
                                    <LoadingState message="Cargando contenido..." />
                                </div>
                            ) : mediaItems.length > 0 ? (
                                mediaItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="media-card"
                                        onClick={() => setSelectedItem(item)}
                                        style={{ '--card-color': activeColor, '--card-shadow': darken(activeColor, 0.2) }}
                                    >
                                        <div className="media-img-wrapper" style={item.overviewImage ? undefined : { background: activeColor + '15' }}>
                                            {item.overviewImage ? (
                                                <img src={item.overviewImage} alt={item.title} className="media-img" />
                                            ) : (
                                                <div className="media-img-placeholder">
                                                    <img
                                                        src={TABS.find(t => t.id === activeTab)?.icon}
                                                        alt=""
                                                        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                                                    />
                                                </div>
                                            )}
                                            <div className="media-duration">{item.duration}s</div>
                                        </div>
                                        <div className="media-info">
                                            <h3 className="media-title">{item.title}</h3>
                                            <p className="media-diff" style={{ color: activeColor }}>{item.difficult}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="content-empty">No hay contenido disponible para esta categoría.</div>
                            )}
                        </div>

                        {selectedItem && (
                            <div className="media-modal-overlay" onClick={() => setSelectedItem(null)}>
                                <div className="media-modal-content" onClick={e => e.stopPropagation()}>
                                    <button className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
                                    {selectedItem.overviewImage && (
                                        <img src={selectedItem.overviewImage} alt={selectedItem.title} className="modal-img" />
                                    )}
                                    <h2 className="modal-title">{selectedItem.title}</h2>
                                    <div className="modal-meta">
                                        <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', fontSize: '1rem', marginRight: '4px' }}>schedule</span> {selectedItem.duration}s</span>
                                        <span><span className="material-symbols-outlined" style={{ verticalAlign: 'middle', fontSize: '1rem', marginRight: '4px' }}>signal_cellular_alt</span> Dificultad: {selectedItem.difficult}</span>
                                    </div>
                                    <p className="modal-desc">{selectedItem.description || 'Sin descripción disponible.'}</p>
                                    <div className="modal-actions">
                                        <button className="btn-play flex items-center justify-center gap-2" onClick={() => handlePlay(selectedItem)}>
                                            <span className="material-symbols-outlined">play_circle</span> Comenzar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentSection;
