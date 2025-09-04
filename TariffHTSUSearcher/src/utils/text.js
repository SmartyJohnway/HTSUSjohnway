/** Utility helpers for text processing. */

/**
 * Escape special characters in a string so it can be safely used inside a
 * regular expression.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str = '') {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight all occurrences of `term` within `text` using a `<mark>` element.
 * The term is matched case-insensitively.
 * @param {string} text
 * @param {string} term
 * @param {string} [className='bg-yellow-200 px-1 rounded'] - class attribute
 *   added to the `<mark>` tag.
 * @returns {string}
 */
export function highlightTerm(text = '', term = '', className = 'bg-yellow-200 px-1 rounded') {
  if (!term) return text;
  const regex = new RegExp(escapeRegExp(term), 'gi');
  return text.replace(regex, match => `<mark class="${className}">${match}</mark>`);
}