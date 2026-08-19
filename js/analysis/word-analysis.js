/**
 * Word Frequency Analyzer with configurable Stop-Word removal.
 */

// Common English + chat filler stop words
const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t',
  'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is',
  'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re',
  'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Common chat noise & fillers
  'omitted', 'media', 'image', 'video', 'audio', 'file', 'attached', 'null', 'undefined',
  'ok', 'okay', 'ha', 'haa', 'hi', 'hello', 'hey', 'hmm', 'hmm', 'hmmm', 'k', 'kk'
]);

/**
 * Analyzes word frequency across chat messages.
 * @param {Array<import('../models/message.js').Message>} messages 
 * @param {Object} options
 * @param {number} [options.limit=50]
 * @param {Set<string>} [options.customStopWords]
 * @returns {Array<{ word: string, count: number }>}
 */
export function analyzeWordFrequency(messages, options = {}) {
  const limit = options.limit || 50;
  const wordCounts = new Map();

  for (const msg of messages) {
    if (msg.isSystem || !msg.text) continue;

    // Clean text: strip punctuation, convert to lowercase
    const words = msg.text
      .toLowerCase()
      .replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F\u0600-\u06FF]/g, ' ') // Preserve Tamil, Hindi, Arabic unicode scripts
      .split(/\s+/);

    for (const w of words) {
      const cleanWord = w.trim();
      if (cleanWord.length < 2) continue; // ignore single letters
      if (ENGLISH_STOP_WORDS.has(cleanWord)) continue;
      if (/^\d+$/.test(cleanWord)) continue; // ignore pure numbers

      wordCounts.set(cleanWord, (wordCounts.get(cleanWord) || 0) + 1);
    }
  }

  const sorted = Array.from(wordCounts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, limit);
}
