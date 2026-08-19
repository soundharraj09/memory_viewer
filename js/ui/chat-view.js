/**
 * Chat Messages View Component with WhatsApp Web Bubbles & Double Checks.
 */

import { VirtualScroller } from './virtual-scroll.js';
import { renderFormattedText, highlightQuery } from '../utils/sanitizer.js';
import { formatTime, formatDateHeader } from '../utils/date-utils.js';
import { getMediaIcon } from '../parser/media-parser.js';

const SENDER_COLORS = [
  '#25d366', '#34b7f1', '#e542a3', '#9c27b0', '#ff9800',
  '#00bcd4', '#795548', '#673ab7', '#3f51b5', '#4caf50'
];

export function getSenderColor(sender) {
  if (!sender) return '#888888';
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

export class ChatView {
  /**
   * @param {HTMLElement} containerElement 
   * @param {Object} options
   * @param {Function} options.onMessageClick
   */
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.onMessageClick = options.onMessageClick;

    this.meSender = null;
    this.defaultRightSender = null;
    this.participants = [];
    this.searchQuery = '';
    this.highlightMessageId = null;

    this.displayItems = [];

    this.scroller = new VirtualScroller(this.container, {
      estimatedItemHeight: this.getEstimatedItemHeight(),
      buffer: 35,
      renderItem: (item, index) => this.renderRow(item, index)
    });
    this.scroller.getEstimatedItemHeight = () => this.getEstimatedItemHeight();
  }

  getEstimatedItemHeight() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches ? 38 : 38;
  }

  setParticipants(participants) {
    this.participants = participants || [];
    if (this.participants.length > 0 && !this.defaultRightSender) {
      this.defaultRightSender = this.participants[0];
    }
  }

  setMeSender(meSender) {
    this.meSender = meSender;
    this.scroller.update();
  }

  swapRightLeft() {
    if (!this.participants || this.participants.length < 2) return;
    
    if (this.defaultRightSender === this.participants[0]) {
      this.defaultRightSender = this.participants[1];
    } else {
      this.defaultRightSender = this.participants[0];
    }

    this.meSender = this.defaultRightSender;
    this.scroller.update();
  }

  setMessages(messages, searchQuery = '') {
    this.searchQuery = searchQuery;

    if (!messages || messages.length === 0) {
      this.displayItems = [];
      this.scroller.setItems([]);
      return;
    }

    const displayItems = [];
    let lastDayKey = -1;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const ts = msg.timestamp;

      if (ts && !isNaN(ts.getTime())) {
        const dayKey = ts.getFullYear() * 10000 + (ts.getMonth() + 1) * 100 + ts.getDate();
        if (dayKey !== lastDayKey) {
          lastDayKey = dayKey;
          displayItems.push({
            type: 'date',
            id: `date-${dayKey}`,
            dateLabel: formatDateHeader(ts)
          });
        }
      }

      displayItems.push({
        type: 'message',
        id: msg.id,
        message: msg
      });
    }

    this.displayItems = displayItems;
    this.scroller.setItems(this.displayItems);
  }

  renderRow(item, index) {
    if (item.type === 'date') {
      const dateRow = document.createElement('div');
      dateRow.className = 'chat-date-separator';
      dateRow.innerHTML = `<span class="date-badge">${item.dateLabel}</span>`;
      return dateRow;
    }

    const msg = item.message;

    let isMe = false;
    if (this.meSender) {
      isMe = msg.sender && msg.sender.toLowerCase() === this.meSender.toLowerCase();
    } else if (this.defaultRightSender) {
      isMe = msg.sender && msg.sender.toLowerCase() === this.defaultRightSender.toLowerCase();
    }

    const row = document.createElement('div');
    row.className = `chat-message-row ${msg.isSystem ? 'system-row' : isMe ? 'me-row' : 'other-row'}`;

    if (this.highlightMessageId === msg.id) {
      row.classList.add('focused-search-result');
    }

    if (msg.isSystem) {
      row.innerHTML = `
        <div class="system-message-bubble">
          ${renderFormattedText(msg.text)}
        </div>
      `;
      row.addEventListener('click', () => this.onMessageClick && this.onMessageClick(msg));
      return row;
    }

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`;

    let senderHTML = '';
    if (!isMe && msg.sender) {
      const color = getSenderColor(msg.sender);
      senderHTML = `<div class="bubble-sender" style="color: ${color}">${renderFormattedText(msg.sender)}</div>`;
    }

    let textHTML = renderFormattedText(msg.text);
    if (this.searchQuery) {
      textHTML = highlightQuery(textHTML, this.searchQuery);
    }

    let mediaHTML = '';
    if (msg.isMedia) {
      const mIcon = getMediaIcon(msg.media ? msg.media.mediaType : 'other');
      if (msg.media && msg.media.blobUrl) {
        if (msg.media.mediaType === 'image') {
          mediaHTML = `<div class="media-container"><img src="${msg.media.blobUrl}" alt="Media Image" loading="lazy" class="chat-media-img" /></div>`;
        } else if (msg.media.mediaType === 'video') {
          mediaHTML = `<div class="media-container"><video src="${msg.media.blobUrl}" controls class="chat-media-video"></video></div>`;
        } else if (msg.media.mediaType === 'audio') {
          mediaHTML = `<div class="media-container"><audio src="${msg.media.blobUrl}" controls class="chat-media-audio"></audio></div>`;
        } else {
          mediaHTML = `<div class="media-file-badge"><a href="${msg.media.blobUrl}" target="_blank" download="${msg.media.filename}">${mIcon} ${msg.media.filename || 'Download Media'}</a></div>`;
        }
      } else {
        mediaHTML = `<div class="media-placeholder-badge">${mIcon} <span class="media-label">${msg.text}</span></div>`;
      }
    }

    const timeHTML = formatTime(msg.timestamp).toLowerCase();
    const checkHTML = isMe ? '<span class="chat-checks">✓✓</span>' : '';

    bubble.innerHTML = `
      ${senderHTML}
      ${mediaHTML ? mediaHTML : ''}
      <div class="bubble-body">
        <span class="bubble-text">${textHTML}</span>
        <span class="bubble-meta">
          <span class="bubble-timestamp">${timeHTML}</span>
          ${checkHTML}
        </span>
      </div>
    `;

    bubble.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO') return;
      if (this.onMessageClick) this.onMessageClick(msg);
    });

    row.appendChild(bubble);
    return row;
  }

  scrollToMessageId(messageId) {
    const itemIndex = this.displayItems.findIndex(item => item.type === 'message' && item.message.id === messageId);
    if (itemIndex !== -1) {
      this.highlightMessageId = messageId;
      this.scroller.scrollToIndex(itemIndex, 'center');
    }
  }
}
