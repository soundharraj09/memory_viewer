/**
 * Internal normalized Chat data model.
 */

export class Chat {
  /**
   * @param {Object} params
   * @param {string} params.title
   * @param {Array<import('./message.js').Message>} params.messages
   * @param {Array<string>} params.participants
   * @param {Object} [params.diagnostics]
   * @param {Map<string, Object>} [params.mediaMap]
   */
  constructor({
    title = 'WhatsApp Chat',
    messages = [],
    participants = [],
    diagnostics = null,
    mediaMap = new Map()
  }) {
    this.title = title;
    this.messages = messages;
    this.participants = participants;
    this.diagnostics = diagnostics || {
      linesProcessed: 0,
      messagesDetected: 0,
      systemMessages: 0,
      mediaMessages: 0,
      multilineMessages: 0,
      unrecognizedLines: []
    };
    this.mediaMap = mediaMap;

    // Derived metadata
    this.startDate = messages.length > 0 ? messages[0].timestamp : null;
    this.endDate = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
    this.totalMessages = messages.length;
  }
}
