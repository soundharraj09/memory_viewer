/**
 * Message Content Classifier & Parser.
 */

import { isMediaPlaceholder, classifyMediaType } from './media-parser.js';

const SYSTEM_MESSAGE_KEYWORDS = [
  'messages and calls are end-to-end encrypted',
  'end-to-end encrypted',
  'created group',
  'created this group',
  'added',
  'left',
  'removed',
  'joined using this group\'s invite link',
  'changed the group description',
  'changed the subject',
  'changed this group\'s icon',
  'changed their phone number',
  'security code changed',
  'turned on disappearing messages',
  'turned off disappearing messages',
  'missed voice call',
  'missed video call',
  'call ended',
  'you deleted this message',
  'this message was deleted'
];

/**
 * Checks if text represents a system event.
 * @param {string} text 
 * @returns {boolean}
 */
export function isSystemMessage(text) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return SYSTEM_MESSAGE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Parses remaining line text after timestamp into Sender & Message Text.
 * @param {string} remainingText 
 * @returns {{ sender: string | null, text: string, type: 'message'|'system'|'media', mediaType?: string }}
 */
export function parseMessageContent(remainingText) {
  if (!remainingText) {
    return { sender: null, text: '', type: 'system' };
  }

  // Look for "Sender: Message" separator
  const colonIndex = remainingText.indexOf(': ');

  if (colonIndex !== -1) {
    const candidateSender = remainingText.substring(0, colonIndex).trim();
    const messageText = remainingText.substring(colonIndex + 2);

    // Ensure candidateSender isn't a long system line containing a colon by mistake
    if (candidateSender.length > 0 && candidateSender.length < 60 && !isSystemMessage(candidateSender)) {
      if (isMediaPlaceholder(messageText)) {
        const mediaType = classifyMediaType(messageText);
        return {
          sender: candidateSender,
          text: messageText,
          type: 'media',
          mediaType
        };
      }
      return {
        sender: candidateSender,
        text: messageText,
        type: 'message'
      };
    }
  }

  // System message without explicit sender colon separator
  const mediaType = isMediaPlaceholder(remainingText) ? classifyMediaType(remainingText) : null;
  const type = mediaType ? 'media' : 'system';

  return {
    sender: null,
    text: remainingText,
    type,
    mediaType
  };
}
