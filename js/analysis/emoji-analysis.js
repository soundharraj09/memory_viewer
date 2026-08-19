/**
 * Emoji Extraction & Frequency Analysis.
 */

import { extractEmojis } from '../utils/unicode.js';

/**
 * Analyzes emoji usage frequency across messages.
 * @param {Array<import('../models/message.js').Message>} messages 
 * @param {number} [limit=50]
 * @returns {Array<{ emoji: string, count: number }>}
 */
export function analyzeEmojiFrequency(messages, limit = 50) {
  const emojiMap = new Map();

  for (const msg of messages) {
    if (msg.isSystem || !msg.text) continue;

    const emojis = extractEmojis(msg.text);
    for (const em of emojis) {
      emojiMap.set(em, (emojiMap.get(em) || 0) + 1);
    }
  }

  return Array.from(emojiMap.entries())
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
