import React from 'react';

/**
 * Tarjeta de palabra seleccionable para el módulo de pronunciación.
 * A diferencia de WordCard (diccionario), la tarjeta completa es el botón:
 * al tocarla se abre el panel de grabación.
 */
const PronunciationWordCard = ({ wordObj, onSelect }) => (
    <button
        type="button"
        onClick={() => onSelect(wordObj)}
        className="kid-card p-5 group flex flex-col h-full text-left w-full"
    >
        <div className="aspect-square w-full rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden mb-4 flex items-center justify-center">
            {wordObj.imageUrl ? (
                <img
                    src={wordObj.imageUrl}
                    alt={wordObj.spanishWord}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            ) : (
                <span className="material-symbols-outlined text-4xl text-gray-300 opacity-50">image_not_supported</span>
            )}
        </div>

        <div className="flex-1 flex flex-col">
            <h3
                className="font-bold text-lg text-gray-800 line-clamp-1"
                title={wordObj.mazahuaWord || wordObj.spanishWord}
            >
                {wordObj.mazahuaWord || wordObj.spanishWord}
            </h3>
            {wordObj.mazahuaWord && (
                <p className="text-sm text-gray-500 font-bold mt-0.5 line-clamp-1">{wordObj.spanishWord}</p>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate pr-2">
                    {wordObj.topicLabel || 'Practicar'}
                </span>
                <span className="w-9 h-9 rounded-full bg-[#E65100]/10 text-[#E65100] flex items-center justify-center border-2 border-[#E65100]/20 shadow-[0_3px_0_#C2410C] group-hover:shadow-[0_4px_0_#C2410C] transition-all">
                    <span className="material-symbols-outlined text-[18px] font-bold">mic</span>
                </span>
            </div>
        </div>
    </button>
);

export default PronunciationWordCard;
