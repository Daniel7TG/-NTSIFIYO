import React, { useState, useEffect } from 'react';

// Modes: success, error, alert, info
const modeStyles = {
    success: {
        icon: 'check_circle',
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100',
        buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    error: {
        icon: 'error',
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100',
        buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    alert: {
        icon: 'warning',
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
        icon: 'info',
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
    }
};

const CustomAlert = ({
    mode = 'info',
    title,
    message,
    dataBox,
    buttons = [{ text: 'Aceptar', type: 'accept', onClick: () => { } }],
    onClose
}) => {
    const style = modeStyles[mode] || modeStyles.info;

    // Countdown support: a button with `countdown: N` stays disabled for N seconds.
    const initialCountdowns = buttons.map(btn => btn.countdown || 0);
    const [countdowns, setCountdowns] = useState(initialCountdowns);

    useEffect(() => {
        if (!countdowns.some(c => c > 0)) return;
        const timer = setInterval(() => {
            setCountdowns(prev => prev.map(c => (c > 0 ? c - 1 : 0)));
        }, 1000);
        return () => clearInterval(timer);
    }, [countdowns]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm backdrop-filter animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 p-6">
                <div className="text-center">
                    <div className={`w-16 h-16 ${style.bgColor} ${style.iconColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <span className="material-symbols-outlined text-3xl">{style.icon}</span>
                    </div>

                    {title && <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>}

                    {message && (
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>
                    )}

                    {dataBox && dataBox.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-200 mb-6">
                            {dataBox.map((data, index) => (
                                <div key={index} className={index !== dataBox.length - 1 ? 'mb-2' : ''}>
                                    <span className="text-xs text-gray-500 uppercase font-semibold">{data.label}</span>
                                    <p className="font-mono text-gray-800 font-medium text-lg">{data.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center mt-6">
                        {buttons.map((btn, index) => {
                            const isCancel = btn.type === 'cancel';
                            const btnClass = isCancel
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : `${style.buttonColor} text-white`;
                            const remaining = countdowns[index];
                            const isWaiting = remaining > 0;

                            return (
                                <button
                                    key={index}
                                    disabled={isWaiting}
                                    onClick={() => {
                                        if (btn.onClick) btn.onClick();
                                        if (onClose && (!btn.preserveOpen)) onClose();
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${btnClass} ${isWaiting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isWaiting ? `${btn.text} (${remaining})` : btn.text}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomAlert;
