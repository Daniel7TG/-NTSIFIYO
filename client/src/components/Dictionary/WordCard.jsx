import React from 'react';

const WordCard = ({ wordObj, renderActions }) => {
    return (
        <div className="kid-card p-5 group flex flex-col h-full relative">

            {/* Action buttons (e.g. Delete for admins) rendered absolutely or injected here */}
            {renderActions && (
                <div className="absolute top-3 right-3 z-10">
                    {renderActions(wordObj)}
                </div>
            )}

            <div className="aspect-square w-full rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden mb-4 relative flex items-center justify-center">
                {wordObj.imageUrl ? (
                    <img
                        src={wordObj.imageUrl}
                        alt={wordObj.spanishWord}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col text-gray-300 gap-2">
                        <span className="material-symbols-outlined text-4xl opacity-50">image_not_supported</span>
                    </div>
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
                    <p className="text-sm text-gray-500 font-bold mt-0.5 line-clamp-1">
                        {wordObj.spanishWord}
                    </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                    <div className="bg-[#E65100]/10 text-[#E65100] text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                        Palabra
                    </div>
                    {wordObj.audioUrl ? (
                        <button
                            onClick={() => new Audio(wordObj.audioUrl).play().catch(e => console.log('Audio disabled/missing'))}
                            className="w-9 h-9 rounded-full bg-[#E65100]/10 text-[#E65100] flex items-center justify-center border-2 border-[#E65100]/20 shadow-[0_3px_0_#C2410C] hover:shadow-[0_4px_0_#C2410C] active:translate-y-0.5 active:shadow-[0_1px_0_#C2410C] transition-all"
                            title="Reproducir Audio"
                        >
                            <span className="material-symbols-outlined text-[18px] font-bold">volume_up</span>
                        </button>
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center cursor-not-allowed border-2 border-gray-200" title="Sin Audio">
                            <span className="material-symbols-outlined text-[18px]">volume_off</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WordCard;
