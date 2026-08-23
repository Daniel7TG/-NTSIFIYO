import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-background-dark border-t border-gray-200 dark:border-white/10 pt-16 pb-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary-dark dark:text-primary">
                            <span className="material-symbols-outlined">school</span>
                        </div>
                        <h2 className="text-lg font-bold text-text-main-light dark:text-white">NTS'I FÍYO</h2>
                    </div>
                    <p className="text-sm text-text-sub-light dark:text-text-sub-dark max-w-md mb-4">
                        Empoderando a la próxima generación para hablar, vivir y celebrar la lengua Mazahua.
                    </p>
                    <div className="flex gap-4">
                        <a
                            href="https://www.facebook.com/profile.php?id=61587122027331"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-sub-light hover:text-primary transition-colors"
                            aria-label="Facebook"
                        >
                            <span className="material-symbols-outlined">public</span>
                        </a>
                        <a
                            href="mailto:contacto@ntsifiyo.com"
                            className="text-text-sub-light hover:text-primary transition-colors"
                            aria-label="Correo"
                        >
                            <span className="material-symbols-outlined">mail</span>
                        </a>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 pt-8">
                    <p className="text-xs text-text-sub-light dark:text-text-sub-dark">
                        © 2026 NTS'I FÍYO. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
