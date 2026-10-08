import React, { useEffect, useId, useState } from 'react';
import { useActivityAttemptHistoryQuery } from '../../hooks/useTeacherReportQueries';
import { getGameTypeInfo } from '../../config/activityConfig';
import { getDifficultyBadge } from '../../utils/difficultyBadges';

const TOPICS = {
    VOWELS: 'Vocales', PRONOUNS: 'Pronombres', NUMBERS: 'Números', SUBJECTS: 'Personas',
    CLOTHES: 'Ropa', FOOD: 'Comida', LEGENDS: 'Leyendas', ANECDOTES: 'Anécdotas',
    ANIMALS: 'Animales', FRUITS: 'Frutas', BODY_PARTS: 'Partes del cuerpo',
    FIVE_SENSES: 'Los sentidos', GREETINGS: 'Saludos', COLORS: 'Colores',
};
const present = value => value !== null && value !== undefined;
const sameId = (a, b) => present(a) && present(b) && String(a) === String(b);
const attemptKey = attempt => String(attempt.attemptId ?? `number-${attempt.attemptNumber}`);
const formatNumber = value => present(value) && Number.isFinite(Number(value))
    ? Number(value).toLocaleString('es-MX', { maximumFractionDigits: 2 }) : '—';
const formatDateTime = value => {
    if (!value) return 'No registrada';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'No registrada' : date.toLocaleString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
};
const elapsedTime = attempt => {
    if (!attempt.finishedAt) return 'En curso';
    if (!attempt.startedAt) return 'No disponible';
    const seconds = Math.floor((new Date(attempt.finishedAt) - new Date(attempt.startedAt)) / 1000);
    if (!Number.isFinite(seconds) || seconds < 0) return 'No disponible';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    return `${hours ? `${hours} h ` : ''}${minutes} min ${seconds % 60} s`;
};
const optionId = option => option.answerId ?? option.wordId;
const optionText = option => option?.answerText
    || [option?.spanishWord, option?.mazahuaWord].filter(Boolean).join(' / ');

function ResultOverview({ label, attempt }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold text-gray-500">{label}</p>
            {attempt ? <>
                <p className="mt-1 font-bold text-gray-800">{formatNumber(attempt.correctAnswers)} / {formatNumber(attempt.totalQuestions)} aciertos</p>
                <p className="text-xs text-gray-600">Intento {attempt.attemptNumber} · {present(attempt.accuracyPercent) ? `${formatNumber(attempt.accuracyPercent)}%` : 'Sin precisión registrada'}</p>
            </> : <p className="mt-1 text-sm text-gray-500">Sin resultado completado</p>}
        </div>
    );
}

function ResponseDetail({ response, index }) {
    const options = Array.isArray(response.options) ? response.options : [];
    const selected = options.find(option => sameId(optionId(option), response.selectedAnswerId));
    const correct = options.find(option => sameId(optionId(option), response.correctAnswerId));
    const selectedText = response.selectedAnswerText || optionText(selected);
    const correctText = response.correctAnswerText || optionText(correct);
    const outcome = response.correct === true ? 'Correcta' : response.correct === false ? 'Incorrecta' : 'Sin calificación';
    return (
        <li className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <h5 className="font-semibold text-gray-800 break-words">{response.questionText || `Elemento ${index + 1}`}</h5>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${response.correct === true ? 'bg-green-100 text-green-800' : response.correct === false ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{outcome}</span>
            </div>
            {response.historicalTextAvailable === false && (
                <p className="mt-2 text-xs text-amber-800">El texto original de este elemento no está disponible.</p>
            )}
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-500">Respuesta elegida</dt><dd className="font-medium text-gray-800 break-words">{selectedText || (present(response.selectedAnswerId) ? `Referencia #${response.selectedAnswerId} · texto no disponible` : 'No registrada')}</dd></div>
                <div><dt className="text-gray-500">Respuesta correcta</dt><dd className="font-medium text-gray-800 break-words">{correctText || (present(response.correctAnswerId) ? `Referencia #${response.correctAnswerId} · texto no disponible` : 'No registrada')}</dd></div>
            </dl>
            {options.length > 0 && <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-gray-500">Opciones de la partida</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                    {options.map((option, optionIndex) => {
                        const isSelected = sameId(optionId(option), response.selectedAnswerId);
                        const isCorrect = option.correct === true || sameId(optionId(option), response.correctAnswerId);
                        return <li key={`${optionId(option) ?? 'option'}-${optionIndex}`} className={`rounded-lg border p-2 text-sm ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                            {option.answerText && <p className="font-medium break-words">{option.answerText}</p>}
                            {option.spanishWord && <p className="break-words"><span className="text-xs text-gray-500">Español: </span>{option.spanishWord}</p>}
                            {option.mazahuaWord && <p className="break-words"><span className="text-xs text-gray-500">Mazahua: </span>{option.mazahuaWord}</p>}
                            {!optionText(option) && <p className="text-gray-500">Texto no disponible</p>}
                            {(isSelected || isCorrect) && <p className="mt-1 text-xs font-semibold">
                                {isSelected && <span className="mr-2 text-blue-700">Elegida</span>}
                                {isCorrect && <span className="text-green-700">Correcta</span>}
                            </p>}
                        </li>;
                    })}
                </ul>
            </div>}
        </li>
    );
}

export default function ActivityAttemptHistory({ activityId, initialAttemptNumber = null }) {
    const query = useActivityAttemptHistoryQuery(activityId, { enabled: present(activityId) && Number(activityId) > 0 });
    const selectId = useId();
    const [selectedKey, setSelectedKey] = useState(null);
    useEffect(() => setSelectedKey(null), [activityId, initialAttemptNumber]);
    const history = query.data;
    const attempts = Array.isArray(history?.attempts) ? history.attempts : [];
    const initial = present(initialAttemptNumber)
        ? attempts.find(attempt => sameId(attempt.attemptNumber, initialAttemptNumber)) : null;
    const selected = attempts.find(attempt => attemptKey(attempt) === selectedKey) || initial || attempts[attempts.length - 1];

    if (!present(activityId) || Number(activityId) <= 0) return <p className="py-3 text-sm text-gray-500">No hay una actividad individual para consultar.</p>;
    if (query.isLoading || (query.isPending && !history)) return <p role="status" className="py-4 text-sm text-gray-500">Cargando historial de intentos...</p>;
    if (query.error) return <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        <p>{query.error.message || 'No se pudo cargar el historial.'}</p>
        <button type="button" onClick={() => query.refetch()} className="mt-2 font-semibold underline">Reintentar historial</button>
    </div>;
    if (!selected) return <p className="py-4 text-sm text-gray-500">Este alumno todavía no ha iniciado ningún intento.</p>;

    const responses = Array.isArray(selected.responses) ? selected.responses : [];
    const difficulty = getDifficultyBadge(selected.difficulty);
    return (
        <section aria-label="Historial de intentos" className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
                <ResultOverview label="Primer resultado" attempt={history.firstResult} />
                <ResultOverview label="Último resultado" attempt={history.lastResult} />
                <ResultOverview label="Mejor resultado" attempt={history.bestResult} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <label htmlFor={selectId} className="mr-2 text-sm font-semibold text-gray-700">Revisar intento</label>
                    <select id={selectId} value={attemptKey(selected)} onChange={event => setSelectedKey(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                        {attempts.map(attempt => <option key={attemptKey(attempt)} value={attemptKey(attempt)}>Intento {attempt.attemptNumber} · {attempt.finishedAt ? 'Completado' : 'En curso'}</option>)}
                    </select>
                </div>
                <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-50">{query.isFetching ? 'Actualizando...' : 'Actualizar historial'}</button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h4 className="font-bold text-gray-800">{selected.gameTitle || 'Actividad sin título histórico'}</h4>
                <p className="mt-1 text-sm text-gray-500">{[
                    selected.gameType ? getGameTypeInfo(selected.gameType).label : null,
                    selected.topic ? TOPICS[selected.topic] || selected.topic.replaceAll('_', ' ') : null,
                    difficulty.label,
                ].filter(Boolean).join(' · ')}</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div><dt className="text-gray-500">Inicio</dt><dd>{formatDateTime(selected.startedAt)}</dd></div>
                    <div><dt className="text-gray-500">Finalización</dt><dd>{selected.finishedAt ? formatDateTime(selected.finishedAt) : 'En curso'}</dd></div>
                    <div><dt className="text-gray-500">Tiempo transcurrido</dt><dd>{elapsedTime(selected)}</dd></div>
                    <div><dt className="text-gray-500">Aciertos</dt><dd>{formatNumber(selected.correctAnswers)} / {formatNumber(selected.totalQuestions)}</dd></div>
                    <div><dt className="text-gray-500">Precisión</dt><dd>{present(selected.accuracyPercent) ? `${formatNumber(selected.accuracyPercent)}%` : 'Sin resultado'}</dd></div>
                    <div><dt className="text-gray-500">XP otorgada</dt><dd>{formatNumber(selected.xpAwarded)}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-gray-500">El tiempo transcurrido abarca el inicio y el fin del intento, incluidas las pausas.</p>
                {present(selected.changeFromPreviousPercent) && <p className="mt-2 text-sm text-gray-600">Cambio frente al intento anterior: {Number(selected.changeFromPreviousPercent) > 0 ? '+' : ''}{formatNumber(selected.changeFromPreviousPercent)} puntos porcentuales.</p>}
            </div>
            {selected.snapshotAvailable === false && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Este intento es anterior al historial detallado. Los textos y opciones originales pueden no estar disponibles.</p>}
            {selected.xpBaselineInferred && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">La XP de este intento es una estimación recuperada del historial anterior.</p>}
            <div>
                <h4 className="mb-3 font-semibold text-gray-800">Respuestas del intento {selected.attemptNumber}</h4>
                {responses.length ? <ol className="space-y-3">{responses.map((response, index) => <ResponseDetail key={`${response.order ?? index}-${index}`} response={response} index={index} />)}</ol>
                    : <p className="text-sm text-gray-500">{selected.finishedAt ? 'No hay respuestas detalladas registradas para este intento.' : 'El intento sigue en curso. Las respuestas estarán disponibles cuando termine.'}</p>}
            </div>
        </section>
    );
}
