/**
 * Unicode normalization and analysis utilities.
 */

/**
 * Normalizes Unicode text, converting non-breaking spaces (\u202f, \u00a0)
 * and stripping left-to-right/right-to-left marks if necessary.
 * @param {string} str 
 * @returns {string}
 */
export function normalizeUnicode(str) {
  if (!str) return '';
  return str
    .replace(/[\u202F\u00A0]/g, ' ') // Normalize narrow/non-breaking spaces to standard space
    .replace(/[\u200E\u200F]/g, ''); // Strip LTR/RTL directional marks
}

/**
 * Accurate Unicode character count (handles emojis and surrogate pairs properly).
 * @param {string} str 
 * @returns {number}
 */
export function countCharacters(str) {
  if (!str) return 0;
  return [...str].length;
}

/**
 * Extracts all emojis from a string using modern Unicode regex property escapes.
 * @param {string} str 
 * @returns {Array<string>}
 */
export function extractEmojis(str) {
  if (!str) return [];
  // Regex pattern matching Emoji characters
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  const matches = str.match(emojiRegex);
  return matches || [];
}
