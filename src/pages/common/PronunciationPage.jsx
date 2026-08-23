import React from 'react';
import PronunciationPractice from '../../components/Pronunciation/PronunciationPractice';
import Breadcrumb from '../../components/common/Breadcrumb';

const PronunciationPage = () => {
    return (
        <div className="w-full flex-1 relative">
            <div className="w-full">
                <div className="max-w-6xl mx-auto p-4 sm:p-8">
                    <Breadcrumb />
                    <PronunciationPractice />
                </div>
            </div>
        </div>
    );
};

export default PronunciationPage;
