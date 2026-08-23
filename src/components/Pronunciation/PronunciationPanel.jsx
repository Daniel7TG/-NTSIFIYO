import React, { useEffect, useState } from 'react';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import PronunciationService from '../../services/PronunciationService';
import PronunciationResult from './PronunciationResult';

/**
 * Panel de práctica de una palabra: escuchar el ejemplo, grabarse con el
 * micrófono y enviar el audio a POST /api/pronunciation/validate/{wordId}.
 *
 * Props:
 *   word    {Object}   – palabra del diccionario (id, spanishWord, mazahuaWord, imageUrl, audioUrl)
 *   onClose {Function} – cerrar el panel
 */
const PronunciationPanel = ({ word, onClose }) => {
    const {
        supported, isPreparing, isRecording, elapsedMs, level, audioBlob, audioUrl, filename,
        error: recorderError, maxDurationMs, start, stop, reset
    } = useAudioRecorder();

    const [result, setResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Cambiar de palabra descarta la grabación y el resultado anteriores.
    useEffect(() => {
        reset();
        setResult(null);
        setValidationError('');
    }, [word?.id, reset]);

    // Cerrar con Escape, como el resto de modales de la app.
    useEffect(() => {
        const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const playExample = () => {
        if (!word?.audioUrl) return;
        new Audio(word.audioUrl).play().catch(() => { /* audio no disponible */ });
    };

    const handleRecordToggle = () => {
        // Durante `isPreparing` el botón cancela: todavía no hay audio que guardar.
        if (isRecording || isPreparing) {
            stop();
        } else {
            setResult(null);
            setValidationError('');
            start();
        }
    };

    const handleValidate = async () => {
        if (!audioBlob || isValidating) return;
        setIsValidating(true);
        setValidationError('');
        setResult(null);

        const response = await PronunciationService.validate(word.id, audioBlob, filename);

        if (response.success) {
            setResult(response.data);
        } else if (response.status === 404) {
            setValidationError('Esta palabra ya no existe en el diccionario.');
        } else if (response.status === 400) {
            setValidationError('No se pudo procesar el audio. Graba de nuevo, un poco más largo.');
        } else {
            setValidationError(response.error || 'No se pudo validar la pronunciación. Intenta otra vez.');
        }
        setIsValidating(false);
    };

    const handleRetry = () => {
        reset();
        setResult(null);
        setValidationError('');
    };

    const seconds = (elapsedMs / 1000).toFixed(1);
    const progress = Math.min(100, (elapsedMs / maxDurationMs) * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">

                {/* Encabezado */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-[#E65100]/10 text-[#E65100] rounded-xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined">record_voice_over</span>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xl font-bold text-gray-800 truncate">
                                {word.mazahuaWord || word.spanishWord}
                            </h3>
                            {word.mazahuaWord && (
                                <p className="text-sm text-gray-500 font-bold truncate">{word.spanishWord}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-xl hover:bg-gray-100 shrink-0"
                        title="Cerrar"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">

                    {/* Imagen + audio de ejemplo */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 shrink-0 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                            {word.imageUrl ? (
                                <img src={word.imageUrl} alt={word.spanishWord} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-3xl text-gray-300">image_not_supported</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 font-medium mb-2">
                                Escucha cómo suena y luego dilo tú en voz alta.
                            </p>
                            <button
                                onClick={playExample}
                                disabled={!word.audioUrl}
                                className="flex items-center gap-2 px-4 py-2 bg-[#E65100]/10 text-[#E65100] font-bold rounded-xl border-2 border-[#E65100]/20 hover:bg-[#E65100]/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[20px]">volume_up</span>
                                {word.audioUrl ? 'Escuchar ejemplo' : 'Sin audio de ejemplo'}
                            </button>
                        </div>
                    </div>

                    {/* Grabadora */}
                    <div className="kid-card p-6 flex flex-col items-center text-center">
                        {!supported ? (
                            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                                <span className="material-symbols-outlined">mic_off</span>
                                Tu navegador no permite grabar audio.
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleRecordToggle}
                                    disabled={isValidating}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all disabled:opacity-60 ${
                                        isRecording
                                            ? 'bg-red-500 border-red-200 text-white shadow-[0_6px_0_#b91c1c] animate-pulse'
                                            : isPreparing
                                                ? 'bg-gray-300 border-gray-200 text-white shadow-[0_6px_0_#9ca3af] cursor-progress'
                                                : 'bg-[#E65100] border-[#E65100]/20 text-white shadow-[0_6px_0_#C2410C] hover:shadow-[0_8px_0_#C2410C] active:translate-y-1 active:shadow-[0_2px_0_#C2410C]'
                                    }`}
                                    title={isRecording ? 'Detener grabación' : isPreparing ? 'Cancelar' : 'Grabar'}
                                >
                                    <span className={`material-symbols-outlined text-[40px] ${isPreparing ? 'animate-spin' : ''}`}>
                                        {isRecording ? 'stop' : isPreparing ? 'progress_activity' : 'mic'}
                                    </span>
                                </button>

                                <p className="mt-4 font-bold text-gray-700">
                                    {isPreparing
                                        ? 'Preparando micrófono...'
                                        : isRecording
                                            ? `Grabando... ${seconds}s`
                                            : audioBlob
                                                ? 'Escucha tu grabación o envíala'
                                                : 'Toca el micrófono y di la palabra'}
                                </p>

                                {isPreparing && (
                                    <p className="mt-1 text-sm text-gray-400 font-medium">
                                        Espera el indicador rojo para empezar a hablar.
                                    </p>
                                )}

                                {isRecording && (
                                    <div className="mt-3 w-full max-w-xs space-y-2">
                                        {/* Nivel de voz: si se queda plano, el backend lo tomará como silencio */}
                                        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-100"
                                                style={{ width: `${Math.min(100, level * 400)}%` }}
                                            />
                                        </div>
                                        {/* Tiempo restante hasta el corte automático */}
                                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className="h-full bg-red-400 rounded-full transition-all duration-100"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {!isRecording && !isPreparing && audioUrl && (
                                    <audio src={audioUrl} controls className="mt-4 w-full max-w-xs">
                                        <track kind="captions" />
                                    </audio>
                                )}
                            </>
                        )}
                    </div>

                    {(recorderError || validationError) && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {recorderError || validationError}
                        </div>
                    )}

                    <PronunciationResult result={result} />
                </div>

                {/* Acciones */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
                    <button
                        type="button"
                        onClick={handleRetry}
                        disabled={(!audioBlob && !result) || isRecording || isPreparing || isValidating}
                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-transparent flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                        Repetir
                    </button>
                    <button
                        type="button"
                        onClick={handleValidate}
                        disabled={!audioBlob || isRecording || isPreparing || isValidating}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                        {isValidating ? (
                            <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Revisando...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[20px]">send</span>Revisar pronunciación</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PronunciationPanel;
