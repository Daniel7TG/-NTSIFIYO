import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente de sabiduría diaria con dato cultural
 */
const DailyWisdom = ({ wisdom }) => {
    const defaultWisdom = {
        badge: 'SABIDURÍA DIARIA',
        title: '¿Sabías que...?',
        fact: 'En la cultura Mazahua, el bordado de la ropa a menudo cuenta una historia sobre la comunidad y el rol del portador.',
        linkText: 'Saber Más'
    };

    const data = wisdom || defaultWisdom;

    return (
        <div
            className="relative rounded-2xl p-6 overflow-hidden"
            style={{
                background: `repeating-conic-gradient(
                    from 0deg at 50% 50%,
                    #bef264 0deg 45deg,
                    #fef08a 45deg 90deg
                )`,
                backgroundSize: '20px 20px'
            }}
        >
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-lime-400/70 to-yellow-300/70 backdrop-blur-[1px]"></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full mb-4">
                    <span className="text-lg">💡</span>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {data.badge}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">{data.title}</h3>

                {/* Fact */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {data.fact}
                </p>

                {/* Link */}
                <Link
                    to="/cultura"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-700 font-semibold rounded-lg hover:bg-white transition-colors text-sm"
                >
                    {data.linkText}
                </Link>
            </div>
        </div>
    );
};

export default DailyWisdom;
