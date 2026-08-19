/**
 * Master WhatsApp Export Parser (Zero-Freeze Streaming Line Scanner).
 */

import { TimestampParser } from './timestamp-parser.js';
import { parseMessageContent } from './message-parser.js';
import { ParserDiagnostics } from './diagnostics.js';
import { Message } from '../models/message.js';
import { Chat } from '../models/chat.js';

/**
 * Non-blocking streaming line scanner.
 * Avoids rawText.split() array memory allocation freeze.
 * @param {string} rawText 
 * @param {Object} options
 * @returns {Promise<Chat>}
 */
export async function parseWhatsAppChatAsync(rawText, options = {}) {
  const title = options.title || 'WhatsApp Chat';
  let dateMode = options.dateMode || 'auto';
  const mediaMap = options.mediaMap || new Map();
  const onProgress = options.onProgress;

  const diagnostics = new ParserDiagnostics();

  if (!rawText || !rawText.trim()) {
    return new Chat({ title, messages: [], participants: [], diagnostics, mediaMap });
  }

  const textLength = rawText.length;

  // Auto date mode sample check
  if (dateMode === 'auto') {
    const sampleLines = [];
    let offset = 0;
    for (let s = 0; s < 500 && offset < textLength; s++) {
      let end = rawText.indexOf('\n', offset);
      if (end === -1) end = textLength;
      let line = rawText.substring(offset, end);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      sampleLines.push(line);
      offset = end + 1;
    }
    dateMode = TimestampParser.detectDateModeFromSamples(sampleLines);
  }

  const timestampParser = new TimestampParser(dateMode);
  const messages = [];
  const participantsSet = new Set();

  let currentMsg = null;
  let messageIdCounter = 1;
  let lineCount = 0;
  let offset = 0;

  const CHUNK_SIZE = 12000;

  while (offset < textLength) {
    let nextNewline = rawText.indexOf('\n', offset);
    if (nextNewline === -1) nextNewline = textLength;

    let rawLine = rawText.substring(offset, nextNewline);
    if (rawLine.endsWith('\r')) {
      rawLine = rawLine.slice(0, -1);
    }
    offset = nextNewline + 1;
    lineCount++;
    diagnostics.recordLine();

    // Yield to main browser UI thread periodically
    if (lineCount % CHUNK_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.round((offset / textLength) * 100));
      }
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    }

    const parsedTS = timestampParser.parseLine(rawLine);

    if (parsedTS) {
      if (currentMsg) {
        messages.push(new Message(currentMsg));
      }

      const { sender, text, type, mediaType } = parseMessageContent(parsedTS.remainingText);

      if (sender) {
        participantsSet.add(sender);
      }

      let mediaObj = null;
      if (type === 'media') {
        const matchedFilename = findMediaFilenameInText(text, mediaMap);
        if (matchedFilename && mediaMap.has(matchedFilename.toLowerCase())) {
          const mapped = mediaMap.get(matchedFilename.toLowerCase());
          mediaObj = {
            filename: mapped.filename,
            mimeType: mapped.mimeType,
            blobUrl: mapped.blobUrl,
            mediaType: mediaType || 'unknown'
          };
        } else {
          mediaObj = {
            filename: null,
            mimeType: null,
            blobUrl: null,
            mediaType: mediaType || 'unknown'
          };
        }
      }

      currentMsg = {
        id: messageIdCounter++,
        type,
        timestamp: parsedTS.date,
        rawTimestamp: parsedTS.rawTimestamp,
        sender,
        text,
        isSystem: type === 'system',
        isMedia: type === 'media',
        media: mediaObj
      };

      diagnostics.recordMessage(type, false);

    } else {
      if (currentMsg) {
        currentMsg.text += '\n' + rawLine;
        diagnostics.recordMessage(currentMsg.type, true);
      } else {
        if (rawLine.trim()) {
          diagnostics.recordUnrecognizedLine(lineCount, rawLine);
          currentMsg = {
            id: messageIdCounter++,
            type: 'system',
            timestamp: new Date(),
            rawTimestamp: '',
            sender: null,
            text: rawLine,
            isSystem: true,
            isMedia: false,
            media: null
          };
          diagnostics.recordMessage('system', false);
        }
      }
    }
  }

  if (currentMsg) {
    messages.push(new Message(currentMsg));
  }

  const participants = Array.from(participantsSet).sort();

  return new Chat({
    title,
    messages,
    participants,
    diagnostics,
    mediaMap
  });
}

/**
 * Synchronous version for tests.
 */
export function parseWhatsAppChat(rawText, options = {}) {
  const title = options.title || 'WhatsApp Chat';
  let dateMode = options.dateMode || 'auto';
  const mediaMap = options.mediaMap || new Map();
  const diagnostics = new ParserDiagnostics();

  if (!rawText || !rawText.trim()) {
    return new Chat({ title, messages: [], participants: [], diagnostics, mediaMap });
  }

  const lines = rawText.split(/\r?\n/);
  const totalLines = lines.length;

  if (dateMode === 'auto') {
    dateMode = TimestampParser.detectDateModeFromSamples(lines);
  }

  const timestampParser = new TimestampParser(dateMode);
  const messages = [];
  const participantsSet = new Set();

  let currentMsg = null;
  let messageIdCounter = 1;

  for (let i = 0; i < totalLines; i++) {
    const rawLine = lines[i];
    diagnostics.recordLine();

    const parsedTS = timestampParser.parseLine(rawLine);

    if (parsedTS) {
      if (currentMsg) {
        messages.push(new Message(currentMsg));
      }

      const { sender, text, type, mediaType } = parseMessageContent(parsedTS.remainingText);
      if (sender) participantsSet.add(sender);

      currentMsg = {
        id: messageIdCounter++,
        type,
        timestamp: parsedTS.date,
        rawTimestamp: parsedTS.rawTimestamp,
        sender,
        text,
        isSystem: type === 'system',
        isMedia: type === 'media',
        media: null
      };

      diagnostics.recordMessage(type, false);
    } else {
      if (currentMsg) {
        currentMsg.text += '\n' + rawLine;
        diagnostics.recordMessage(currentMsg.type, true);
      } else {
        if (rawLine.trim()) {
          diagnostics.recordUnrecognizedLine(i + 1, rawLine);
          currentMsg = {
            id: messageIdCounter++,
            type: 'system',
            timestamp: new Date(),
            rawTimestamp: '',
            sender: null,
            text: rawLine,
            isSystem: true,
            isMedia: false,
            media: null
          };
          diagnostics.recordMessage('system', false);
        }
      }
    }
  }

  if (currentMsg) messages.push(new Message(currentMsg));
  const participants = Array.from(participantsSet).sort();

  return new Chat({ title, messages, participants, diagnostics, mediaMap });
}

function findMediaFilenameInText(text, mediaMap) {
  if (!text || mediaMap.size === 0) return null;
  for (const filename of mediaMap.keys()) {
    if (text.toLowerCase().includes(filename)) return filename;
  }
  return null;
}
