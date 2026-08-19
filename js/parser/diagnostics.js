/**
 * Parser Diagnostics and Quality Metrics Collector.
 */

export class ParserDiagnostics {
  constructor() {
    this.linesProcessed = 0;
    this.messagesDetected = 0;
    this.systemMessages = 0;
    this.mediaMessages = 0;
    this.multilineMessages = 0;
    this.unrecognizedLines = [];
  }

  recordLine() {
    this.linesProcessed++;
  }

  recordMessage(type, isMultiline = false) {
    this.messagesDetected++;
    if (type === 'system') this.systemMessages++;
    if (type === 'media') this.mediaMessages++;
    if (isMultiline) this.multilineMessages++;
  }

  recordUnrecognizedLine(lineNumber, lineText) {
    if (this.unrecognizedLines.length < 200) { // cap preview sample
      this.unrecognizedLines.push({ lineNumber, text: lineText });
    }
  }

  getSummary() {
    return {
      linesProcessed: this.linesProcessed,
      messagesDetected: this.messagesDetected,
      systemMessages: this.systemMessages,
      mediaMessages: this.mediaMessages,
      multilineMessages: this.multilineMessages,
      unrecognizedLinesCount: this.unrecognizedLines.length,
      unrecognizedLinesSample: this.unrecognizedLines
    };
  }
}
