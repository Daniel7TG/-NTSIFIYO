import { useEffect } from 'react';

/**
 * Hook para animaciones de scroll en la landing page.
 */
const useScrollAnimations = () => {
    useEffect(() => {
        const SELECTOR = '.reveal, .reveal-left, .reveal-right, .reveal-scale';

        /* ── 1. Reveal on Scroll via IntersectionObserver ─── */
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.04, rootMargin: '0px 0px -20px 0px' }
        );

        const observeAll = () => {
            document.querySelectorAll(SELECTOR).forEach(el => {
                if (!el.classList.contains('visible')) {
                    io.observe(el);
                }
            });
        };

        observeAll();
        const t1 = setTimeout(observeAll, 200);
        const t2 = setTimeout(observeAll, 600);
        const t3 = setTimeout(observeAll, 1500);

        /* ── 2. Parallax scroll tracking ─────────────────── */
        const updateScrollY = () => {
            document.documentElement.style.setProperty(
                '--scroll-y', `${window.scrollY}px`
            );
            // Also re-check reveals on each scroll for reliability
            observeAll();
        };
        window.addEventListener('scroll', updateScrollY, { passive: true });
        updateScrollY();

        /* ── 3. Counter-up animation ─────────────────────── */
        const counterIO = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterIO.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        const t4 = setTimeout(() => {
            document.querySelectorAll('.counter-animate').forEach(el => {
                counterIO.observe(el);
            });
        }, 400);

        return () => {
            [t1, t2, t3, t4].forEach(clearTimeout);
            io.disconnect();
            counterIO.disconnect();
            window.removeEventListener('scroll', updateScrollY);
        };
    }, []);
};

function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

export default useScrollAnimations;
