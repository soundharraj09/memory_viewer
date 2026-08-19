/**
 * Internal normalized Message data model.
 */

import { countCharacters } from '../utils/unicode.js';
import { extractURLs } from '../utils/sanitizer.js';

export class Message {
  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {'message'|'system'|'media'} params.type
   * @param {Date} params.timestamp
   * @param {string} params.rawTimestamp
   * @param {string|null} params.sender
   * @param {string} params.text
   * @param {boolean} [params.isSystem=false]
   * @param {boolean} [params.isMedia=false]
   * @param {Object|null} [params.media=null]
   */
  constructor({
    id,
    type = 'message',
    timestamp,
    rawTimestamp = '',
    sender = null,
    text = '',
    isSystem = false,
    isMedia = false,
    media = null
  }) {
    this.id = id;
    this.type = type; // 'message' | 'system' | 'media'
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.rawTimestamp = rawTimestamp;
    this.sender = sender ? sender.trim() : null;
    this.text = text;
    this.isSystem = isSystem || type === 'system';
    this.isMedia = isMedia || type === 'media';
    this.media = media; // { filename, mimeType, blobUrl, mediaType }

    // Derived properties
    this.links = extractURLs(text);
    this.characterCount = countCharacters(text);
    this.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  }
}
