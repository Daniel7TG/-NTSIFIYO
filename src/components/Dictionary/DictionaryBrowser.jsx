import React, { useState, useEffect } from 'react';
import CategoryGrid from './CategoryGrid';
import WordsGrid from './WordsGrid';
import DictionaryService from '../../services/DictionaryService';
import { useAlert } from '../../context/AlertContext';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { DICTIONARY_TOPICS } from '../../utils/gameCategories';
import { useDictionaryWordsQuery, useDictionaryInvalidate } from '../../hooks/useDictionaryQueries';

const DictionaryBrowser = ({ isAdmin = false }) => {
    const { showAlert } = useAlert();
    const { updateBreadcrumbs } = useBreadcrumb();

    // Words state
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [wordsCurrentPage, setWordsCurrentPage] = useState(0);

    // TanStack Query for words — caches each topic+page combo
    const { data: wordsData, isLoading: isLoadingWords, error: wordsErrorObj } = useDictionaryWordsQuery(selectedTopic, wordsCurrentPage);
    const { reloadWords } = useDictionaryInvalidate();

    const categoryWords = wordsData?.words || [];
    const wordsTotalPages = wordsData?.totalPages ?? 1;
    const categoryWordsError = wordsErrorObj?.message || '';

    // Create Word Modal state (admin only)
    const [isCreateWordModalOpen, setIsCreateWordModalOpen] = useState(false);
    const [createWordForm, setCreateWordForm] = useState({ spanishText: '', mazahuaText: '', topic: '' });
    const [createWordMedia, setCreateWordMedia] = useState({ image: null, audio: null });
    const [isCreatingWord, setIsCreatingWord] = useState(false);
    const [createWordError, setCreateWordError] = useState('');

    useEffect(() => {
        if (selectedTopic) {
            const topicObj = DICTIONARY_TOPICS.find(t => t.id === selectedTopic);
            updateBreadcrumbs([
                {
                    label: isAdmin ? 'Palabras' : 'Diccionario',
                    onClick: () => setSelectedTopic(null)
                },
                { label: topicObj ? topicObj.label : selectedTopic }
            ]);
        } else {
            updateBreadcrumbs([]);
        }
    }, [selectedTopic, updateBreadcrumbs, isAdmin]);

    const handleSelectTopic = (topicId) => {
        setSelectedTopic(topicId);
        setWordsCurrentPage(0);
    };


    const handleCreateWordFormChange = (e) => {
        setCreateWordForm({ ...createWordForm, [e.target.name]: e.target.value });
    };

    const handleCreateWordMediaChange = (e) => {
        setCreateWordMedia({ ...createWordMedia, [e.target.name]: e.target.files[0] });
    };

    const submitCreateWord = async (e) => {
        e.preventDefault();
        setIsCreatingWord(true);
        setCreateWordError('');
        try {
            const formData = new FormData();
            formData.append('spanishText', createWordForm.spanishText);
            formData.append('mazahuaText', createWordForm.mazahuaText);
            formData.append('topic', createWordForm.topic);
            if (createWordMedia.image) formData.append('image', createWordMedia.image);
            if (createWordMedia.audio) formData.append('audio', createWordMedia.audio);

            await DictionaryService.createWord(formData);

            setIsCreateWordModalOpen(false);
            setCreateWordForm({ spanishText: '', mazahuaText: '', topic: '' });
            setCreateWordMedia({ image: null, audio: null });

            if (selectedTopic && selectedTopic === createWordForm.topic) {
                reloadWords(selectedTopic);
            }

            showAlert({
                mode: 'success',
                title: 'Éxito',
                message: 'Palabra creada correctamente.'
            });

        } catch (error) {
            console.error('Error creating word:', error);
            setCreateWordError(error.message);
        } finally {
            setIsCreatingWord(false);
        }
    };

    const deleteWord = async (wordId) => {
        showAlert({
            mode: 'alert',
            title: 'Confirmar eliminación',
            message: '¿Estás seguro de que deseas eliminar esta palabra? Esta acción no se puede deshacer.',
            buttons: [
                { text: 'Cancelar', type: 'cancel' },
                {
                    text: 'Eliminar',
                    type: 'accept',
                    onClick: async () => {
                        try {
                            const result = await DictionaryService.deleteWord(wordId);
                            if (result.success) {
                                showAlert({ mode: 'success', title: 'Éxito', message: 'Palabra eliminada.' });
                                reloadWords(selectedTopic);
                            } else {
                                throw new Error(result.error);
                            }
                        } catch (err) {
                            showAlert({ mode: 'error', title: 'Error', message: err.message || 'Error al eliminar la palabra.' });
                        }
                    }
                }
            ]
        });
    };

    const renderWordActions = (word) => {
        if (!isAdmin) return null;
        return (
            <button
                onClick={() => deleteWord(word.id)}
                className="w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-red-500 hover:text-white rounded-full text-red-500 shadow-sm transition-colors border border-red-100"
                title="Eliminar palabra"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
        );
    };

    const renderCreateWordModal = () => {
        if (!isCreateWordModalOpen || !isAdmin) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined">add_circle</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Crear Nueva Palabra</h3>
                        </div>
                        <button onClick={() => setIsCreateWordModalOpen(false)} className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-xl hover:bg-gray-100">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <form id="createWordForm" onSubmit={submitCreateWord} className="space-y-4">
                            {createWordError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">error</span>{createWordError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Palabra en Español *</label>
                                <input type="text" name="spanishText" required value={createWordForm.spanishText} onChange={handleCreateWordFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Ej. Perro" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Palabra en Mazahua *</label>
                                <input type="text" name="mazahuaText" required value={createWordForm.mazahuaText} onChange={handleCreateWordFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Ej. T'sïbue" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Tema *</label>
                                <select name="topic" required value={createWordForm.topic} onChange={handleCreateWordFormChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                                    <option value="">Selecciona un tema...</option>
                                    {DICTIONARY_TOPICS.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Imagen *</label>
                                    <input type="file" name="image" required accept="image/png, image/jpeg, image/webp" onChange={handleCreateWordMediaChange}
                                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Audio *</label>
                                    <input type="file" name="audio" required accept="audio/wav, audio/mpeg" onChange={handleCreateWordMediaChange}
                                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 transition-colors" />
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
                        <button type="button" onClick={() => setIsCreateWordModalOpen(false)} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                        <button type="submit" form="createWordForm" disabled={isCreatingWord}
                            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-70">
                            {isCreatingWord ? (<><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Guardando...</>) : (<><span className="material-symbols-outlined text-[20px]">save</span>Guardar Palabra</>)}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (selectedTopic) {
        const topicObj = DICTIONARY_TOPICS.find(t => t.id === selectedTopic);
        return (
            <div className="space-y-6 animate-fade-in-up">
                {renderCreateWordModal()}
                {isAdmin && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => { setCreateWordForm({ spanishText: '', mazahuaText: '', topic: selectedTopic }); setIsCreateWordModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>Nueva Palabra
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setWordsCurrentPage(p => Math.max(0, p - 1))}
                            disabled={wordsCurrentPage === 0 || isLoadingWords}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                            Página {wordsCurrentPage + 1} de {wordsTotalPages}
                        </span>

                        <button
                            onClick={() => setWordsCurrentPage(p => p + 1)}
                            disabled={wordsCurrentPage >= wordsTotalPages - 1 || isLoadingWords}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:text-gray-500"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                    </div>
                </div>

                <WordsGrid
                    words={categoryWords}
                    isLoading={isLoadingWords}
                    error={categoryWordsError}
                    onRetry={() => reloadWords(selectedTopic)}
                    renderActions={renderWordActions}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {renderCreateWordModal()}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Diccionario</h2>
                    <p className="text-gray-500 mt-1">Explora las palabras por tema.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => { setCreateWordForm({ spanishText: '', mazahuaText: '', topic: '' }); setIsCreateWordModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined">add</span>Crear Palabra
                    </button>
                )}
            </div>

            <CategoryGrid
                topics={DICTIONARY_TOPICS}
                onSelectTopic={handleSelectTopic}
            />
        </div>
    );
};

export default DictionaryBrowser;
