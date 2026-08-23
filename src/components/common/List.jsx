import React from 'react';

/**
 * Componente de lista reutilizable que renderiza una tabla con encabezados y acciones.
 *
 * Props:
 * - headers: Array<{ label: string, align?: 'left'|'center'|'right' }>
 *   Encabezados de la tabla.
 *
 * - items: Array<any>
 *   Lista de elementos a mostrar.
 *
 * - renderRow: (item, index) => JSX.Element
 *   Función que renderiza las celdas <td> de cada fila.
 *   No incluye acciones; esas se pasan por separado.
 *
 * - actions: (item, index) => JSX.Element | null   [opcional]
 *   Función que retorna el contenido de la columna de acciones.
 *   Si se pasa, se agrega automáticamente una columna "Acciones" al final.
 *
 * - isLoading: boolean  [opcional]
 *   Muestra un indicador de carga.
 *
 * - error: string | null  [opcional]
 *   Muestra un mensaje de error.
 *
 * - emptyMessage: string  [opcional]
 *   Mensaje cuando no hay elementos. Por defecto "No hay elementos."
 *
 * - emptyIcon: string  [opcional]
 *   Nombre de material symbol a mostrar en estado vacío.
 */
const List = ({
    headers = [],
    items = [],
    renderRow,
    actions,
    isLoading = false,
    error = null,
    emptyMessage = 'No hay elementos.',
    emptyIcon = 'list_alt'
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary/50">
                    progress_activity
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">
                    {emptyIcon}
                </span>
                {emptyMessage}
            </div>
        );
    }

    // Construir todos los encabezados: los pasados + "Acciones" si aplica
    const allHeaders = actions
        ? [...headers, { label: 'Acciones', align: 'right' }]
        : headers;

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse bg-white">
                <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                        {allHeaders.map((header, idx) => (
                            <th
                                key={idx}
                                className={`py-3 px-4 font-bold ${header.align === 'center'
                                        ? 'text-center'
                                        : header.align === 'right'
                                            ? 'text-right'
                                            : 'text-left'
                                    }`}
                            >
                                {header.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                        <tr
                            key={index}
                            className="hover:bg-blue-50/30 transition-colors group"
                        >
                            {renderRow(item, index)}
                            {actions && (
                                <td className="py-3 px-4 text-right">
                                    <div className="inline-flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        {actions(item, index)}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default List;
