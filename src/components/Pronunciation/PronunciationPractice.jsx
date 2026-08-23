import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import LoadingState from '../common/LoadingState';
import PronunciationHero from './PronunciationHero';
import PronunciationWordCard from './PronunciationWordCard';
import PronunciationPanel from './PronunciationPanel';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { usePronunciationWordsQuery, pronunciationKeys } from '../../hooks/usePronunciationQueries';

/**
 * Módulo de práctica de pronunciación.
 *
 * Sólo se listan las palabras marcadas con `pronunciation: true` en el diccionario
 * (las que el modelo del backend sabe evaluar). Son pocas, así que se muestran
 * todas juntas en una sola vista, sin navegación por temas.
 */
const PronunciationPractice = () => {
    const { updateBreadcrumbs } = useBreadcrumb();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [selectedWord, setSelectedWord] = useState(null);

    const { data: words = [], isLoading, error } = usePronunciationWordsQuery();

    // Vista plana: no hay niveles que mostrar en el breadcrumb.
    useEffect(() => { updateBreadcrumbs([]); }, [updateBreadcrumbs]);

    const filteredWords = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return words;
        return words.filter(word =>
            [word.spanishWord, word.mazahuaWord, word.topicLabel]
                .some(value => (value || '').toLowerCase().includes(term))
        );
    }, [words, search]);

    const renderBody = () => {
        if (isLoading) return <LoadingState message="Buscando palabras para practicar..." />;

        if (error) {
            return (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3 shadow-sm">
                    <span className="material-symbols-outlined">error</span>
                    <span className="font-medium flex-1">{error.message}</span>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: pronunciationKeys.words() })}
                        className="text-sm border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }

        if (words.length === 0) {
            return (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-gray-300">mic_off</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Aún no hay palabras para practicar</h3>
                    <p className="text-gray-500 mt-1 max-w-sm">
                        Ninguna palabra del diccionario está habilitada para pronunciación todavía.
                    </p>
                </div>
            );
        }

        if (filteredWords.length === 0) {
            return (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Sin resultados</h3>
                    <p className="text-gray-500 mt-1 max-w-sm">
                        Ninguna palabra coincide con «{search}».
                    </p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWords.map((wordObj, idx) => (
                    <PronunciationWordCard
                        key={wordObj.id || idx}
                        wordObj={wordObj}
                        onSelect={setSelectedWord}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {selectedWord && (
                <PronunciationPanel word={selectedWord} onClose={() => setSelectedWord(null)} />
            )}

            <PronunciationHero
                search={search}
                onSearchChange={setSearch}
                wordCount={words.length}
                visibleCount={filteredWords.length}
                showCount={!isLoading && !error && words.length > 0}
            />

            {renderBody()}
        </div>
    );
};

export default PronunciationPractice;
