/**
 * Security & HTML Sanitization utilities.
 */

/**
 * Escapes special HTML characters to prevent XSS attacks.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extracts URLs from plain text string.
 * @param {string} text 
 * @returns {Array<string>}
 */
export function extractURLs(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s<]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Safely renders formatted chat message text:
 * 1. Escapes raw HTML
 * 2. Linkifies URLs safely with target="_blank" rel="noopener noreferrer"
 * 3. Formats *bold*, _italic_, ~strikethrough~
 * 4. Converts newlines to <br>
 * @param {string} rawText 
 * @returns {string} Safe HTML string
 */
export function renderFormattedText(rawText) {
  if (!rawText) return '';
  
  // Step 1: Escape HTML first for XSS safety
  let safe = escapeHTML(rawText);

  // Step 2: Linkify URLs
  // Matches escaped URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s&<]+)/gi;
  safe = safe.replace(urlRegex, (url) => {
    // Strip trailing punctuation if accidentally matched
    const cleanUrl = url.replace(/[.,;:!?]+$/, '');
    const trailing = url.slice(cleanUrl.length);
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="chat-url">${cleanUrl}</a>${trailing}`;
  });

  // Step 3: WhatsApp style formatting
  // *bold*
  safe = safe.replace(/(^|\s)\*([^\*\n]+)\*(\s|$)/g, '$1<strong>$2</strong>$3');
  // _italic_
  safe = safe.replace(/(^|\s)_([^_\n]+)_(\s|$)/g, '$1<em>$2</em>$3');
  // ~strikethrough~
  safe = safe.replace(/(^|\s)~([^~\n]+)~(\s|$)/g, '$1<del>$2</del>$3');

  // Step 4: Preserve line breaks
  safe = safe.replace(/\n/g, '<br>');

  return safe;
}

/**
 * Highlights search queries inside rendered safe HTML.
 * @param {string} html 
 * @param {string} query 
 * @returns {string}
 */
export function highlightQuery(html, query) {
  if (!html || !query || !query.trim()) return html;
  
  const escapedQuery = escapeHTML(query.trim());
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  
  // Careful replace that avoids replacing inside HTML attributes (like href="")
  const parts = html.split(/(<[^>]+>)/g);
  return parts.map(part => {
    if (part.startsWith('<') && part.endsWith('>')) {
      return part; // Return HTML tag intact
    }
    return part.replace(regex, '<mark class="search-highlight">$1</mark>');
  }).join('');
}
