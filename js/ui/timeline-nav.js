/**
 * Year/Month Timeline Tree Navigation Component.
 */

import { TimelineAggregator } from '../analysis/timeline.js';

export class TimelineNav {
  /**
   * @param {HTMLElement} containerElement 
   * @param {Object} options
   * @param {Function} options.onMonthSelect
   */
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.onMonthSelect = options.onMonthSelect;
  }

  /**
   * Renders timeline navigation tree.
   * @param {Array<import('../models/message.js').Message>} messages 
   */
  render(messages) {
    const timeline = TimelineAggregator.buildTimeline(messages);
    if (!timeline || timeline.length === 0) {
      this.container.innerHTML = '<p class="text-muted">No timeline data</p>';
      return;
    }

    this.container.innerHTML = `
      <div class="timeline-tree">
        ${timeline.map(yearGroup => `
          <div class="timeline-year-item">
            <div class="year-header" data-year="${yearGroup.year}">
              <span class="tree-arrow">▶</span>
              <span class="year-label"><strong>${yearGroup.year}</strong></span>
              <span class="year-badge">${yearGroup.count.toLocaleString()} msgs</span>
            </div>
            <div class="month-list hidden" id="year-months-${yearGroup.year}">
              ${yearGroup.months.map(m => `
                <div class="month-item" data-index="${m.firstMessageIndex}">
                  <span class="month-name">${m.monthName}</span>
                  <span class="month-count">${m.count.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add accordion expand/collapse & month click handlers
    const yearHeaders = this.container.querySelectorAll('.year-header');
    yearHeaders.forEach(hdr => {
      hdr.addEventListener('click', () => {
        const year = hdr.getAttribute('data-year');
        const monthList = this.container.querySelector(`#year-months-${year}`);
        const arrow = hdr.querySelector('.tree-arrow');
        if (monthList) {
          monthList.classList.toggle('hidden');
          arrow.classList.toggle('expanded');
        }
      });
    });

    // Expand the first (most recent) year by default
    if (yearHeaders.length > 0) {
      yearHeaders[0].click();
    }

    const monthItems = this.container.querySelectorAll('.month-item');
    monthItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const msgIndex = parseInt(item.getAttribute('data-index'), 10);
        
        // Active styling
        monthItems.forEach(m => m.classList.remove('active'));
        item.classList.add('active');

        if (this.onMonthSelect && !isNaN(msgIndex)) {
          this.onMonthSelect(msgIndex);
        }
      });
    });
  }
}
