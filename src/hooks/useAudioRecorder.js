// client/src/hooks/useAudioRecorder.js
// Grabación de micrófono en WAV PCM 16 kHz mono (lo que espera el modelo del backend).
//
// No se usa MediaRecorder a propósito: su salida WebM/Opus llegaba al backend como
// audio inservible (todo se reconocía igual o como silencio), el mismo problema que
// tuvo la app móvil por el formato en que guardaba las grabaciones. Capturando las
// muestras con Web Audio y escribiendo el WAV aquí, el audio que recibe el modelo es
// exactamente PCM mono de 16 kHz y no depende de cómo FFmpeg decodifique el contenedor.
//
// El indicador de "grabando" se enciende con el primer bloque de audio real, no al
// conectar los nodos: entre el permiso del micrófono, el arranque del hardware y el
// primer callback del procesador pasan cientos de milisegundos, y antes la interfaz
// decía "grabando" mientras todavía no entraba nada. Mientras tanto se muestra
// `isPreparing`. El cronómetro tampoco usa reloj de pared: cuenta las muestras
// capturadas, así que lo que marca en pantalla es exactamente lo que va en el WAV.

import { useCallback, useEffect, useRef, useState } from 'react';

/** Frecuencia de muestreo que usa el modelo del backend. */
const TARGET_SAMPLE_RATE = 16000;

/** Corte automático: las palabras del diccionario son cortas. */
const MAX_DURATION_MS = 8000;

/** Tamaño del buffer de captura (potencia de 2 admitida por ScriptProcessor). */
const BUFFER_SIZE = 4096;

/**
 * Al soltar el botón, el bloque que el procesador está llenando todavía no se
 * entregó. Se sigue capturando un instante más para no cortar el final de la
 * palabra: la grabación nunca queda más corta que lo que mostró la interfaz.
 */
const TAIL_MS = 250;

/**
 * El backend marca SILENCE por debajo de RMS 0.005. Con micrófonos flojos una toma
 * válida puede quedar debajo, así que si el pico es bajo se sube el volumen sin
 * saturar. Es sólo escala lineal: no altera el timbre que analiza el modelo.
 */
const LOW_PEAK_THRESHOLD = 0.35;
const NORMALIZED_PEAK = 0.7;

const isSupported = () =>
    typeof window !== 'undefined' &&
    !!(window.AudioContext || window.webkitAudioContext) &&
    !!navigator.mediaDevices?.getUserMedia;

/** Une los bloques Float32 capturados en un solo buffer. */
function mergeChunks(chunks, totalLength) {
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
    }
    return merged;
}

/** Remuestreo lineal a 16 kHz (los AudioContext suelen correr a 44.1/48 kHz). */
function resample(samples, fromRate, toRate) {
    if (fromRate === toRate) return samples;

    const ratio = fromRate / toRate;
    const outLength = Math.floor(samples.length / ratio);
    const output = new Float32Array(outLength);

    for (let i = 0; i < outLength; i++) {
        const position = i * ratio;
        const index = Math.floor(position);
        const frac = position - index;
        const current = samples[index] || 0;
        const next = samples[index + 1] !== undefined ? samples[index + 1] : current;
        output[i] = current + (next - current) * frac;
    }
    return output;
}

/** Sube el nivel de tomas flojas para que no se confundan con silencio. */
function normalize(samples) {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
        const value = Math.abs(samples[i]);
        if (value > peak) peak = value;
    }
    if (peak === 0 || peak >= LOW_PEAK_THRESHOLD) return samples;

    const gain = NORMALIZED_PEAK / peak;
    const output = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) output[i] = samples[i] * gain;
    return output;
}

/** Escribe un WAV PCM 16-bit mono a partir de muestras Float32 en [-1, 1]. */
function encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, text) => {
        for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);             // tamaño del bloque fmt
    view.setUint16(20, 1, true);              // formato: PCM
    view.setUint16(22, 1, true);              // canales: mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // bytes por segundo
    view.setUint16(32, 2, true);              // alineación de bloque
    view.setUint16(34, 16, true);             // bits por muestra
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const clamped = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
        offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
}

/**
 * Hook de grabación de micrófono.
 *
 * Fases: `idle` → `preparing` (pidiendo micrófono, aún sin audio) →
 * `recording` (entrando muestras) → `stopping` (cola final) → `idle`.
 *
 * @returns {{
 *   supported: boolean, isPreparing: boolean, isRecording: boolean,
 *   elapsedMs: number, level: number, audioBlob: Blob|null, audioUrl: string|null,
 *   filename: string, error: string, maxDurationMs: number,
 *   start: () => Promise<void>, stop: () => void, reset: () => void
 * }}
 */
export function useAudioRecorder() {
    const [supported] = useState(isSupported);
    const [isPreparing, setIsPreparing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [level, setLevel] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [error, setError] = useState('');

    const contextRef = useRef(null);
    const streamRef = useRef(null);
    const sourceRef = useRef(null);
    const processorRef = useRef(null);
    const chunksRef = useRef([]);
    const lengthRef = useRef(0);
    const rateRef = useRef(TARGET_SAMPLE_RATE);
    const levelRef = useRef(0);
    const timerRef = useRef(null);
    const tailRef = useRef(null);
    const audioUrlRef = useRef(null);
    const phaseRef = useRef('idle');

    const revokeAudioUrl = useCallback(() => {
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
    }, []);

    /** Suelta micrófono, nodos de audio y temporizadores. */
    const teardown = useCallback(() => {
        clearInterval(timerRef.current);
        clearTimeout(tailRef.current);
        timerRef.current = null;
        tailRef.current = null;

        if (processorRef.current) {
            processorRef.current.onaudioprocess = null;
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        sourceRef.current?.disconnect();
        sourceRef.current = null;

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        contextRef.current?.close().catch(() => { /* ya cerrado */ });
        contextRef.current = null;
    }, []);

    const reset = useCallback(() => {
        revokeAudioUrl();
        setAudioBlob(null);
        setAudioUrl(null);
        setElapsedMs(0);
        setLevel(0);
        setError('');
    }, [revokeAudioUrl]);

    /** Cierra la captura y arma el WAV con lo que efectivamente entró. */
    const finalize = useCallback(() => {
        const sourceRate = rateRef.current;
        const captured = mergeChunks(chunksRef.current, lengthRef.current);
        chunksRef.current = [];
        lengthRef.current = 0;

        teardown();
        phaseRef.current = 'idle';
        setIsPreparing(false);
        setIsRecording(false);
        setLevel(0);

        if (captured.length === 0) {
            setError('No entró audio del micrófono. Revisa que no esté silenciado e intenta de nuevo.');
            setElapsedMs(0);
            return;
        }

        const samples = normalize(resample(captured, sourceRate, TARGET_SAMPLE_RATE));
        const blob = encodeWav(samples, TARGET_SAMPLE_RATE);

        revokeAudioUrl();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        setElapsedMs((captured.length / sourceRate) * 1000);
        setAudioBlob(blob);
        setAudioUrl(url);
    }, [teardown, revokeAudioUrl]);

    const stop = useCallback(() => {
        const phase = phaseRef.current;

        // Aún no llegaba audio: no hay nada que guardar, sólo se cancela.
        if (phase === 'preparing') {
            teardown();
            phaseRef.current = 'idle';
            setIsPreparing(false);
            return;
        }

        if (phase !== 'recording') return;

        phaseRef.current = 'stopping';
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsRecording(false);

        // Se deja correr un momento para recoger el bloque en curso.
        tailRef.current = setTimeout(finalize, TAIL_MS);
    }, [teardown, finalize]);

    const start = useCallback(async () => {
        if (!supported) {
            setError('Tu navegador no permite grabar audio. Prueba con Chrome, Edge o Firefox.');
            return;
        }
        if (phaseRef.current !== 'idle') return;

        reset();
        phaseRef.current = 'preparing';
        setIsPreparing(true);

        let stream;
        try {
            // Sin procesamiento del navegador: el modelo espera la voz tal cual,
            // y la supresión de ruido puede recortar sílabas cortas.
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
        } catch (err) {
            phaseRef.current = 'idle';
            setIsPreparing(false);
            const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
            setError(denied
                ? 'No diste permiso para usar el micrófono. Actívalo en el navegador e intenta de nuevo.'
                : 'No se encontró un micrófono disponible.');
            return;
        }

        // El usuario pudo cancelar mientras se resolvía el permiso.
        if (phaseRef.current !== 'preparing') {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        let context;
        try {
            // Pedir 16 kHz directo evita remuestrear; si el navegador no lo admite,
            // se graba a su frecuencia y se remuestrea al finalizar.
            try {
                context = new AudioContextClass({ sampleRate: TARGET_SAMPLE_RATE });
            } catch {
                context = new AudioContextClass();
            }
            await context.resume();
        } catch {
            stream.getTracks().forEach(track => track.stop());
            phaseRef.current = 'idle';
            setIsPreparing(false);
            setError('No se pudo iniciar la grabación en este navegador.');
            return;
        }

        const source = context.createMediaStreamSource(stream);
        const processor = context.createScriptProcessor(BUFFER_SIZE, 1, 1);

        chunksRef.current = [];
        lengthRef.current = 0;
        levelRef.current = 0;
        rateRef.current = context.sampleRate;

        const maxSamples = Math.round((MAX_DURATION_MS / 1000) * context.sampleRate);

        processor.onaudioprocess = (event) => {
            const phase = phaseRef.current;
            if (phase !== 'preparing' && phase !== 'recording' && phase !== 'stopping') return;

            const input = event.inputBuffer.getChannelData(0);
            chunksRef.current.push(new Float32Array(input));
            lengthRef.current += input.length;

            let sum = 0;
            for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
            levelRef.current = Math.sqrt(sum / input.length);

            // Primer bloque real: recién aquí empieza de verdad la grabación,
            // así que es aquí donde se enciende el indicador y arranca el conteo.
            if (phase === 'preparing') {
                phaseRef.current = 'recording';
                setIsPreparing(false);
                setIsRecording(true);

                timerRef.current = setInterval(() => {
                    setElapsedMs((lengthRef.current / rateRef.current) * 1000);
                    setLevel(levelRef.current);
                }, 100);
            }

            if (phaseRef.current === 'recording' && lengthRef.current >= maxSamples) {
                stop();
            }
        };

        // Un destino mudo mantiene vivo el procesador sin devolver la voz por la bocina.
        const silentGain = context.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(context.destination);

        contextRef.current = context;
        streamRef.current = stream;
        sourceRef.current = source;
        processorRef.current = processor;
    }, [supported, reset, stop]);

    // Al desmontar: soltar micrófono y liberar la URL del blob.
    useEffect(() => () => {
        phaseRef.current = 'idle';
        teardown();
        revokeAudioUrl();
    }, [teardown, revokeAudioUrl]);

    return {
        supported,
        isPreparing,
        isRecording,
        elapsedMs,
        level,
        audioBlob,
        audioUrl,
        filename: 'grabacion.wav',
        error,
        maxDurationMs: MAX_DURATION_MS,
        start,
        stop,
        reset
    };
}

export default useAudioRecorder;
