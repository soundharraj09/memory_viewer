/**
 * Message Details Inspector Modal.
 */

import { formatFullDateTime } from '../utils/date-utils.js';
import { escapeHTML } from '../utils/sanitizer.js';

export class DetailsModal {
  constructor(modalContainer) {
    this.modalContainer = modalContainer;
    this.modalContent = modalContainer.querySelector('.modal-body');
    this.closeBtn = modalContainer.querySelector('.modal-close');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    this.modalContainer.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) {
        this.hide();
      }
    });
  }

  /**
   * Shows message details.
   * @param {import('../models/message.js').Message} msg 
   */
  show(msg) {
    if (!msg) return;

    this.modalContent.innerHTML = `
      <div class="message-details-view">
        <div class="detail-row">
          <label>Sender:</label>
          <span>${msg.sender ? escapeHTML(msg.sender) : '<em>System Entry</em>'}</span>
        </div>
        <div class="detail-row">
          <label>Timestamp:</label>
          <span>${formatFullDateTime(msg.timestamp)}</span>
        </div>
        <div class="detail-row">
          <label>Message Type:</label>
          <span class="badge-type">${msg.type}</span>
        </div>
        <div class="detail-row">
          <label>Character Count:</label>
          <span>${msg.characterCount.toLocaleString()} chars</span>
        </div>
        <div class="detail-row">
          <label>Word Count:</label>
          <span>${msg.wordCount.toLocaleString()} words</span>
        </div>
        ${msg.links.length > 0 ? `
          <div class="detail-row">
            <label>Detected Links:</label>
            <span>${msg.links.length} link(s)</span>
          </div>
        ` : ''}
        <div class="detail-raw-text">
          <label>Raw Text Content:</label>
          <textarea readonly class="raw-text-box">${escapeHTML(msg.text)}</textarea>
        </div>
        <div class="detail-actions">
          <button class="btn btn-primary copy-msg-btn">📋 Copy Message Text</button>
        </div>
      </div>
    `;

    const copyBtn = this.modalContent.querySelector('.copy-msg-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(msg.text).then(() => {
          copyBtn.textContent = '✅ Copied!';
          setTimeout(() => copyBtn.textContent = '📋 Copy Message Text', 2000);
        });
      });
    }

    this.modalContainer.classList.add('active');
  }

  hide() {
    this.modalContainer.classList.remove('active');
  }
}
