/**
 * Local Export & PDF/Print Modal Controller.
 */

import { formatFullDateTime } from '../utils/date-utils.js';

export class ExportModal {
  /**
   * @param {HTMLElement} modalContainer 
   */
  constructor(modalContainer) {
    this.modalContainer = modalContainer;
    this.closeBtn = modalContainer.querySelector('.modal-close');
    this.activeMessages = [];
    this.chatTitle = 'WhatsApp Chat';

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    this.modalContainer.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) this.hide();
    });

    this.initExportButtons();
  }

  initExportButtons() {
    const txtBtn = this.modalContainer.querySelector('.export-txt-btn');
    const jsonBtn = this.modalContainer.querySelector('.export-json-btn');
    const csvBtn = this.modalContainer.querySelector('.export-csv-btn');
    const printBtn = this.modalContainer.querySelector('.export-print-btn');

    if (txtBtn) txtBtn.addEventListener('click', () => this.exportTXT());
    if (jsonBtn) jsonBtn.addEventListener('click', () => this.exportJSON());
    if (csvBtn) csvBtn.addEventListener('click', () => this.exportCSV());
    if (printBtn) printBtn.addEventListener('click', () => {
      this.hide();
      window.print();
    });
  }

  /**
   * Show export modal with active messages set.
   * @param {Array<import('../models/message.js').Message>} messages 
   * @param {string} title 
   */
  show(messages, title = 'WhatsApp Chat') {
    this.activeMessages = messages || [];
    this.chatTitle = title;

    const countEl = this.modalContainer.querySelector('.export-count-label');
    if (countEl) {
      countEl.textContent = `${this.activeMessages.length.toLocaleString()} messages ready for export`;
    }

    this.modalContainer.classList.add('active');
  }

  hide() {
    this.modalContainer.classList.remove('active');
  }

  downloadBlob(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportTXT() {
    const lines = this.activeMessages.map(msg => {
      const ts = msg.rawTimestamp || formatFullDateTime(msg.timestamp);
      if (msg.sender) {
        return `${ts} - ${msg.sender}: ${msg.text}`;
      }
      return `${ts} - ${msg.text}`;
    });

    const content = lines.join('\n');
    this.downloadBlob(content, `${this.chatTitle}_export.txt`, 'text/plain;charset=utf-8');
  }

  exportJSON() {
    const data = {
      chatTitle: this.chatTitle,
      exportedAt: new Date().toISOString(),
      messageCount: this.activeMessages.length,
      messages: this.activeMessages.map(msg => ({
        id: msg.id,
        type: msg.type,
        timestamp: msg.timestamp ? msg.timestamp.toISOString() : null,
        sender: msg.sender,
        text: msg.text,
        isSystem: msg.isSystem,
        isMedia: msg.isMedia,
        links: msg.links,
        wordCount: msg.wordCount,
        characterCount: msg.characterCount
      }))
    };

    const content = JSON.stringify(data, null, 2);
    this.downloadBlob(content, `${this.chatTitle}_export.json`, 'application/json;charset=utf-8');
  }

  exportCSV() {
    const headers = ['ID', 'Timestamp', 'Sender', 'Type', 'Text', 'Word Count', 'Character Count'];
    const rows = [headers.join(',')];

    this.activeMessages.forEach(msg => {
      const ts = msg.timestamp ? msg.timestamp.toISOString() : '';
      const sender = msg.sender ? `"${msg.sender.replace(/"/g, '""')}"` : '';
      const type = msg.type;
      const text = `"${(msg.text || '').replace(/"/g, '""')}"`;
      rows.push([msg.id, ts, sender, type, text, msg.wordCount, msg.characterCount].join(','));
    });

    const content = rows.join('\n');
    this.downloadBlob(content, `${this.chatTitle}_export.csv`, 'text/csv;charset=utf-8');
  }
}
