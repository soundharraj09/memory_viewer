/**
 * Main Application Orchestrator.
 */

import { readTextFile, readZipFile } from './utils/file-utils.js';
import { parseWhatsAppChatAsync } from './parser/whatsapp-parser.js';
import { computeChatStatistics } from './analysis/statistics.js';
import { LandingView } from './ui/landing-view.js';
import { ChatView } from './ui/chat-view.js';
import { StatisticsView } from './ui/statistics-view.js';
import { SearchController } from './ui/search.js';
import { FilterController } from './ui/filters.js';
import { TimelineNav } from './ui/timeline-nav.js';
import { DetailsModal } from './ui/details-modal.js';
import { ExportModal } from './ui/export-modal.js';
import { PrivacyModal } from './ui/privacy-modal.js';
import { MeSelector } from './ui/me-selector.js';
import { ThemeController } from './ui/theme.js';
import { ParserTestSuite } from './tests/parser-test-suite.js';
import { escapeHTML } from './utils/sanitizer.js';

class WhatsAppChatApp {
  constructor() {
    this.currentChat = null;
    this.filteredMessages = [];
    this.searchQuery = '';
    this.dateMode = 'auto';
    this.activeTab = 'chat';

    this.initUI();
  }

  initUI() {
    // Theme
    const themeBtn = document.getElementById('theme-toggle-btn');
    this.themeController = new ThemeController(themeBtn);

    // Modals
    this.detailsModal = new DetailsModal(document.getElementById('details-modal'));
    this.exportModal = new ExportModal(document.getElementById('export-modal'));
    this.privacyModal = new PrivacyModal(document.getElementById('privacy-modal'));

    // Privacy badge trigger
    const privacyBadge = document.getElementById('privacy-badge-btn');
    if (privacyBadge) {
      privacyBadge.addEventListener('click', () => this.privacyModal.show());
    }

    // Landing Screen (Source File List + File Upload)
    const landingEl = document.getElementById('landing-screen');
    this.landingView = new LandingView(landingEl, {
      onFileSelected: (file) => this.handleFile(file),
      onSourceFileSelected: (path, name) => this.handleSourceFileSelect(path, name)
    });

    // Header buttons
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this.resetAppToLanding());
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (this.currentChat) {
          this.exportModal.show(this.filteredMessages, this.currentChat.title);
        }
      });
    }

    const diagBtn = document.getElementById('diagnostics-btn');
    if (diagBtn) {
      diagBtn.addEventListener('click', () => this.showDiagnosticsModal());
    }

    // Date Ambiguity setting dropdown
    const dateModeSelect = document.getElementById('date-mode-select');
    if (dateModeSelect) {
      dateModeSelect.addEventListener('change', async () => {
        this.dateMode = dateModeSelect.value;
        if (this.rawText) {
          await this.parseAndRenderChat(this.rawText, this.rawFilename, this.rawMediaMap);
        }
      });
    }

    // "Who are you?" Me selector
    const meSelectEl = document.getElementById('me-sender-select');
    this.meSelector = new MeSelector(meSelectEl, (meSender) => {
      if (this.chatView) {
        this.chatView.setMeSender(meSender);
      }
    });

    // Swap Right/Left Alignment button
    const swapBtn = document.getElementById('swap-alignment-btn');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        if (this.chatView) {
          this.chatView.swapRightLeft();
        }
      });
    }

    // Jump to Date Picker
    const jumpDatePicker = document.getElementById('jump-date-picker');
    if (jumpDatePicker) {
      jumpDatePicker.addEventListener('change', () => {
        const val = jumpDatePicker.value;
        if (val) {
          this.jumpToDate(new Date(val + 'T00:00:00'));
        }
      });
    }

    // Tab switcher
    const tabChatBtn = document.getElementById('tab-chat-btn');
    const tabStatsBtn = document.getElementById('tab-stats-btn');
    const chatPane = document.getElementById('chat-main-pane');
    const statsPane = document.getElementById('stats-main-pane');

    if (tabChatBtn && tabStatsBtn) {
      tabChatBtn.addEventListener('click', () => {
        this.activeTab = 'chat';
        tabChatBtn.classList.add('active');
        tabStatsBtn.classList.remove('active');
        chatPane.classList.remove('hidden');
        statsPane.classList.add('hidden');

        if (this.chatView && this.chatView.scroller) {
          this.chatView.scroller.update();
        }
      });

      tabStatsBtn.addEventListener('click', () => {
        this.activeTab = 'stats';
        tabStatsBtn.classList.add('active');
        tabChatBtn.classList.remove('active');
        statsPane.classList.remove('hidden');
        chatPane.classList.add('hidden');
        this.statisticsView.render(this.currentChat);
      });
    }

    // Mobile Bottom Navigation
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        mobileNavItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        if (target === 'chat') {
          tabChatBtn.click();
        } else if (target === 'stats') {
          tabStatsBtn.click();
        } else if (target === 'search') {
          document.getElementById('search-input').focus();
        } else if (target === 'timeline') {
          document.getElementById('sidebar-timeline-container').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Chat View & Virtual Scroller
    const chatContainer = document.getElementById('chat-viewport');
    this.chatView = new ChatView(chatContainer, {
      onMessageClick: (msg) => this.detailsModal.show(msg)
    });

    // Statistics View
    const statsContainer = document.getElementById('stats-container');
    this.statisticsView = new StatisticsView(statsContainer);

    // Search Controller
    this.searchController = new SearchController({
      inputEl: document.getElementById('search-input'),
      countEl: document.getElementById('search-count-label'),
      prevBtn: document.getElementById('search-prev-btn'),
      nextBtn: document.getElementById('search-next-btn')
    }, {
      onSearch: (query) => {
        this.searchQuery = query;
        this.applyFilters();
        return this.filteredMessages.map(m => m.id);
      },
      onNavigate: (messageId) => {
        this.chatView.scrollToMessageId(messageId);
      }
    });

    // Filter Controller
    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    const filterBar = document.getElementById('filter-bar');
    if (mobileFilterToggle && filterBar) {
      mobileFilterToggle.addEventListener('click', () => {
        const isOpen = filterBar.classList.toggle('mobile-open');
        mobileFilterToggle.classList.toggle('active', isOpen);
        mobileFilterToggle.setAttribute('aria-expanded', String(isOpen));

        if (this.chatView && this.chatView.scroller) {
          requestAnimationFrame(() => this.chatView.scroller.update());
        }
      });
    }

    this.filterController = new FilterController({
      participantSelect: document.getElementById('filter-participant'),
      typeSelect: document.getElementById('filter-type'),
      fromDateInput: document.getElementById('filter-from-date'),
      toDateInput: document.getElementById('filter-to-date'),
      resetBtn: document.getElementById('filter-reset-btn')
    }, {
      onFilterChange: () => this.applyFilters()
    });

    // Timeline Navigation
    const timelineContainer = document.getElementById('timeline-tree-container');
    this.timelineNav = new TimelineNav(timelineContainer, {
      onMonthSelect: (firstMessageIndex) => {
        if (this.currentChat && this.currentChat.messages[firstMessageIndex]) {
          const targetMsgId = this.currentChat.messages[firstMessageIndex].id;
          this.chatView.scrollToMessageId(targetMsgId);
        }
      }
    });
  }

  async handleSourceFileSelect(filePath, fileName) {
    try {
      this.landingView.showProgress(`Fetching ${fileName}...`, 15);
      const res = await fetch(filePath);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const rawText = await res.text();
      this.landingView.showProgress('Parsing chat messages (0%)...', 30);
      this.rawText = rawText;
      this.rawFilename = fileName;
      this.rawMediaMap = new Map();

      // Parse text asynchronously
      this.currentChat = await parseWhatsAppChatAsync(rawText, {
        title: fileName.replace(/\.(txt|zip)$/i, '').replace(/^WhatsApp Chat with /i, '').trim(),
        dateMode: this.dateMode,
        mediaMap: this.rawMediaMap,
        onProgress: (pct) => {
          this.landingView.showProgress(`Parsing messages and dates (${pct}%)...`, 30 + Math.round(pct * 0.65));
        }
      });

      // Show dashboard IMMEDIATELY
      this.landingView.hideProgress();
      this.landingView.hide();
      document.getElementById('app-dashboard').classList.remove('hidden');

      // Populate UI components
      this.chatView.setParticipants(this.currentChat.participants);
      this.meSelector.setParticipants(this.currentChat.participants);
      this.filterController.populateParticipants(this.currentChat.participants);

      const titleEl = document.getElementById('chat-title-display');
      const subtitleEl = document.getElementById('chat-subtitle-display');
      if (titleEl) titleEl.textContent = 'Our Chat Memories';
      if (subtitleEl) subtitleEl.textContent = `${this.currentChat.totalMessages.toLocaleString()} memories • ${this.currentChat.participants.length} people`;

      this.timelineNav.render(this.currentChat.messages);
      this.renderQuickSummary();

      this.filterController.resetFilters();
      this.applyFilters();

      if (this.chatView && this.chatView.scroller) {
        requestAnimationFrame(() => this.chatView.scroller.update());
      }
    } catch (e) {
      console.error(e);
      this.landingView.hideProgress();
      alert(`Error loading selected file: ${e.message}`);
    }
  }

  async handleFile(file) {
    if (!file) return;

    this.landingView.showProgress('Reading file into browser memory...', 10);

    try {
      let rawText = '';
      let filename = file.name;
      let mediaMap = new Map();

      if (filename.toLowerCase().endsWith('.zip')) {
        this.landingView.showProgress('Extracting ZIP archive locally...', 25);
        const zipResult = await readZipFile(file, (pct) => {
          this.landingView.showProgress(`Extracting media attachments (${pct}%)...`, 25 + Math.round(pct * 0.35));
        });
        rawText = zipResult.chatText;
        filename = zipResult.chatFilename;
        mediaMap = zipResult.mediaMap;
      } else {
        rawText = await readTextFile(file, (pct) => {
          this.landingView.showProgress(`Reading chat file (${pct}%)...`, pct * 0.5);
        });
      }

      this.rawText = rawText;
      this.rawFilename = filename;
      this.rawMediaMap = mediaMap;

      this.currentChat = await parseWhatsAppChatAsync(rawText, {
        title: filename.replace(/\.(txt|zip)$/i, '').replace(/^WhatsApp Chat with /i, '').trim(),
        dateMode: this.dateMode,
        mediaMap,
        onProgress: (pct) => {
          this.landingView.showProgress(`Parsing messages and dates (${pct}%)...`, 50 + Math.round(pct * 0.45));
        }
      });

      this.landingView.hideProgress();
      this.landingView.hide();
      document.getElementById('app-dashboard').classList.remove('hidden');

      this.chatView.setParticipants(this.currentChat.participants);
      this.meSelector.setParticipants(this.currentChat.participants);
      this.filterController.populateParticipants(this.currentChat.participants);

      const titleEl = document.getElementById('chat-title-display');
      const subtitleEl = document.getElementById('chat-subtitle-display');
      if (titleEl) titleEl.textContent = 'Our Chat Memories';
      if (subtitleEl) subtitleEl.textContent = `${this.currentChat.totalMessages.toLocaleString()} memories • ${this.currentChat.participants.length} people`;

      this.timelineNav.render(this.currentChat.messages);
      this.renderQuickSummary();

      this.filterController.resetFilters();
      this.applyFilters();

      if (this.chatView && this.chatView.scroller) {
        requestAnimationFrame(() => this.chatView.scroller.update());
      }

    } catch (err) {
      console.error(err);
      this.landingView.hideProgress();
      alert(`Error reading chat export: ${err.message}`);
    }
  }

  async parseAndRenderChat(rawText, filename, mediaMap, onProgress) {
    let title = filename.replace(/\.(txt|zip)$/i, '').replace(/^WhatsApp Chat with /i, '').trim();

    this.currentChat = await parseWhatsAppChatAsync(rawText, {
      title,
      dateMode: this.dateMode,
      mediaMap,
      onProgress
    });

    this.chatView.setParticipants(this.currentChat.participants);
    this.meSelector.setParticipants(this.currentChat.participants);
    this.filterController.populateParticipants(this.currentChat.participants);

    const titleEl = document.getElementById('chat-title-display');
    const subtitleEl = document.getElementById('chat-subtitle-display');
    if (titleEl) titleEl.textContent = 'Our Chat Memories';
    if (subtitleEl) subtitleEl.textContent = `${this.currentChat.totalMessages.toLocaleString()} memories • ${this.currentChat.participants.length} people`;

    this.timelineNav.render(this.currentChat.messages);
    this.renderQuickSummary();

    this.filterController.resetFilters();
    this.applyFilters();

    if (this.chatView && this.chatView.scroller) {
      requestAnimationFrame(() => this.chatView.scroller.update());
    }
  }

  renderQuickSummary() {
    const box = document.getElementById('quick-summary-box');
    if (!box || !this.currentChat) return;

    const stats = computeChatStatistics(this.currentChat);
    if (!stats) return;

    const { overview, participants, insights } = stats;

    box.innerHTML = `
      <div class="qs-card">
        <div class="qs-row">
          <span class="qs-label">Total Messages:</span>
          <span class="qs-val"><strong>${overview.totalMessages.toLocaleString()}</strong></span>
        </div>
        <div class="qs-row">
          <span class="qs-label">Active Days:</span>
          <span class="qs-val">${overview.activeDaysCount.toLocaleString()} days</span>
        </div>
        <div class="qs-row">
          <span class="qs-label">Avg Msgs / Day:</span>
          <span class="qs-val">${overview.avgMessagesPerActiveDay}</span>
        </div>
        <div class="qs-row">
          <span class="qs-label">Duration:</span>
          <span class="qs-val">${overview.durationText}</span>
        </div>
      </div>

      <div class="qs-section-title">Participants</div>
      ${participants.map(p => `
        <div class="qs-participant-row">
          <div class="qs-p-name"><strong>${escapeHTML(p.name)}</strong></div>
          <div class="qs-p-bar-track">
            <div class="qs-p-bar-fill" style="width: ${p.percentage}%"></div>
          </div>
          <div class="qs-p-count">${p.messageCount.toLocaleString()} (${p.percentage}%)</div>
        </div>
      `).join('')}

      <div class="qs-section-title">Quick Insights</div>
      <div class="qs-insight-row">
        <span>🏆 Peak Day:</span>
        <span>${insights.mostActiveDay ? `${insights.mostActiveDay.date} (${insights.mostActiveDay.count} msgs)` : 'N/A'}</span>
      </div>
      <div class="qs-insight-row">
        <span>⏰ Peak Hour:</span>
        <span>${insights.mostActiveHour.hour} (${insights.mostActiveHour.count} msgs)</span>
      </div>
      <div class="qs-insight-row">
        <span>📁 Media Count:</span>
        <span>${insights.totalMediaMessages.toLocaleString()}</span>
      </div>
    `;
  }

  applyFilters() {
    if (!this.currentChat) return;

    const filterState = this.filterController.getFilterState();
    this.filteredMessages = FilterController.filterMessages(
      this.currentChat.messages,
      filterState,
      this.searchQuery
    );

    this.chatView.setMessages(this.filteredMessages, this.searchQuery);

    if (this.activeTab === 'stats') {
      this.statisticsView.render(this.currentChat);
    }
  }

  jumpToDate(targetDate) {
    if (!this.currentChat || this.currentChat.messages.length === 0) return;

    const targetMs = targetDate.getTime();
    let closestMsg = this.currentChat.messages[0];
    let minDiff = Math.abs(closestMsg.timestamp.getTime() - targetMs);

    for (let i = 1; i < this.currentChat.messages.length; i++) {
      const msg = this.currentChat.messages[i];
      if (msg.timestamp) {
        const diff = Math.abs(msg.timestamp.getTime() - targetMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestMsg = msg;
        }
      }
    }

    this.chatView.scrollToMessageId(closestMsg.id);
  }

  resetAppToLanding() {
    document.getElementById('app-dashboard').classList.add('hidden');
    this.landingView.show();
  }

  showDiagnosticsModal() {
    if (!this.currentChat) {
      alert('Please load a chat first to view diagnostics.');
      return;
    }

    const d = this.currentChat.diagnostics.getSummary();
    const modalContainer = document.getElementById('diagnostics-modal');
    const body = modalContainer.querySelector('.modal-body');

    body.innerHTML = `
      <div class="diagnostics-modal-content">
        <h2>🛠️ Parser Diagnostics</h2>
        <div class="diag-summary-grid">
          <div class="diag-card">
            <span class="diag-num">${d.linesProcessed.toLocaleString()}</span>
            <span class="diag-label">Lines Processed</span>
          </div>
          <div class="diag-card">
            <span class="diag-num">${d.messagesDetected.toLocaleString()}</span>
            <span class="diag-label">Messages Detected</span>
          </div>
          <div class="diag-card">
            <span class="diag-num">${d.systemMessages.toLocaleString()}</span>
            <span class="diag-label">System Messages</span>
          </div>
          <div class="diag-card">
            <span class="diag-num">${d.mediaMessages.toLocaleString()}</span>
            <span class="diag-label">Media Messages</span>
          </div>
          <div class="diag-card">
            <span class="diag-num">${d.multilineMessages.toLocaleString()}</span>
            <span class="diag-label">Multiline Lines</span>
          </div>
          <div class="diag-card">
            <span class="diag-num">${d.unrecognizedLinesCount.toLocaleString()}</span>
            <span class="diag-label">Unrecognized Lines</span>
          </div>
        </div>

        ${d.unrecognizedLinesSample.length > 0 ? `
          <h3>Unrecognized Lines Preview</h3>
          <div class="unrecognized-box">
            ${d.unrecognizedLinesSample.map(u => `<div>Line ${u.lineNumber}: ${u.text}</div>`).join('')}
          </div>
        ` : ''}

        <div class="test-suite-action">
          <button class="btn btn-secondary run-tests-btn">🧪 Run Automated 25-Test Parser Suite</button>
          <div class="test-results-container"></div>
        </div>
      </div>
    `;

    const closeBtn = modalContainer.querySelector('.modal-close');
    closeBtn.onclick = () => modalContainer.classList.remove('active');

    const testBtn = body.querySelector('.run-tests-btn');
    const testResultsEl = body.querySelector('.test-results-container');

    testBtn.addEventListener('click', () => {
      const suiteResults = ParserTestSuite.runAll();
      testResultsEl.innerHTML = `
        <div class="suite-results-card">
          <h4>Test Suite Execution Results: ${suiteResults.passed} / ${suiteResults.total} PASSED</h4>
          <div class="test-list">
            ${suiteResults.details.map(t => `
              <div class="test-item ${t.passed ? 'pass' : 'fail'}">
                <span>${t.testName}</span>: <strong>${t.details}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    modalContainer.classList.add('active');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WhatsAppChatApp();
});
