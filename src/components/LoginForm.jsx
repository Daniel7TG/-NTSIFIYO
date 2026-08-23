import React, { useState } from 'react';

const LoginForm = () => {
    const [userType, setUserType] = useState('student'); // Default

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-text-main">Welcome Back</h2>
                <p className="text-text-muted">Select your profile to continue.</p>
            </div>

            {/* Selector de Perfil (Solo para Login) */}
            <div className="grid grid-cols-3 gap-3">
                {['student', 'teacher', 'guest'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setUserType(type)}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${userType === type ? 'border-primary bg-[#e7f3e7]' : 'border-transparent bg-white shadow-sm'}`}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {type === 'student' ? 'face' : type === 'teacher' ? 'school' : 'person'}
                        </span>
                        <span className="text-xs font-bold capitalize">{type}</span>
                    </button>
                ))}
            </div>

            <form className="flex flex-col gap-4">
                {/* Lógica Dinámica de Campos */}
                {userType === 'student' && (
                    <>
                        <input className="w-full p-3 rounded-lg border border-[#cfe7cf]" placeholder="Class Code or Student ID" type="text" />
                        <div className="grid grid-cols-4 gap-2"> {/* PIN Visual simple */}
                            {[1, 2, 3, 4].map(n => <div key={n} className="h-12 w-full bg-white border-2 border-primary/20 rounded-lg flex items-center justify-center font-bold text-primary">?</div>)}
                        </div>
                        <p className="text-xs text-center text-text-muted italic">Ask your teacher for your visual PIN!</p>
                    </>
                )}

                {userType === 'teacher' && (
                    <>
                        <input className="w-full p-3 rounded-lg border border-[#cfe7cf]" placeholder="Full Name" type="text" />
                        <input className="w-full p-3 rounded-lg border border-[#cfe7cf]" placeholder="Password" type="password" />
                    </>
                )}

                {userType === 'guest' && (
                    <>
                        <input className="w-full p-3 rounded-lg border border-[#cfe7cf]" placeholder="Username" type="text" />
                        <input className="w-full p-3 rounded-lg border border-[#cfe7cf]" placeholder="Password" type="password" />
                    </>
                )}

                <button className="w-full py-3.5 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20">
                    Enter Platform
                </button>
            </form>
        </div>
    );
};

export default LoginForm;