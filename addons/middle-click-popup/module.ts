const textWidthCache = new Map<string, number>();
const textWidthCacheSize = 1000;

const eventTarget = new EventTarget();
const eventClearTextCache = 'clearTextCache';

/**
 * Gets the width of an svg text element, with caching.
 * @param textElement
 */
export function getTextWidth (textElement: SVGTextElement) {
    const string: string = textElement.innerHTML;
    if (string.length === 0) return 0;
    let width: number | undefined = textWidthCache.get(string);
    if (width !== undefined) return width;
    width = textElement.getBoundingClientRect().width;
    textWidthCache.set(string, width);
    if (textWidthCache.size > textWidthCacheSize) {
        textWidthCache.delete(textWidthCache.keys().next().value);
    }
    return width;
}

/**
 * Clears the text width cache of the middle click popup.
 */
export function clearTextWidthCache () {
    textWidthCache.clear();
    eventTarget.dispatchEvent(new CustomEvent(eventClearTextCache));
}

/**
 * @param {() => void} func
 */
export function onClearTextWidthCache (func: () => void) {
    eventTarget.addEventListener(eventClearTextCache, func);
}
