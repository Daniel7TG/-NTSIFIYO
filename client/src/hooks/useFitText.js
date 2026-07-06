import { useRef, useEffect, useCallback } from 'react';

/**
 * useFitText – Shrinks font-size so the text fits in one line within its container.
 *
 * @param {object}  opts
 * @param {number}  opts.maxFontSize  – Upper-bound font size in px (default 18)
 * @param {number}  opts.minFontSize  – Lower-bound font size in px (default 8)
 * @param {string}  opts.text         – The text being rendered (triggers recalculation)
 * @returns {React.RefObject} ref to attach to the text element
 */
export default function useFitText({ maxFontSize = 18, minFontSize = 8, text } = {}) {
    const ref = useRef(null);

    const fit = useCallback(() => {
        const el = ref.current;
        if (!el) return;

        // Reset to max so we can measure the "natural" width
        el.style.fontSize = `${maxFontSize}px`;

        const containerWidth = el.clientWidth;
        if (containerWidth === 0) return; // not fully rendered yet

        // If the content already fits, done
        if (el.scrollWidth <= containerWidth) return;

        // Binary search for the right font size
        let lo = minFontSize;
        let hi = maxFontSize;
        while (hi - lo > 0.5) {
            const mid = (lo + hi) / 2;
            el.style.fontSize = `${mid}px`;
            if (el.scrollWidth > containerWidth) {
                hi = mid;
            } else {
                lo = mid;
            }
        }
        el.style.fontSize = `${lo}px`;
    }, [maxFontSize, minFontSize]);

    useEffect(() => {
        fit();

        // Re-fit when the container resizes (responsive / grid changes)
        const el = ref.current;
        const container = el?.parentElement;
        if (!container) return;

        const ro = new ResizeObserver(() => fit());
        ro.observe(container);
        return () => ro.disconnect();
    }, [fit, text]);

    return ref;
}
