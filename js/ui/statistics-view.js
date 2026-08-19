/**
 * Statistics & Analytics Dashboard Renderer.
 */

import { computeChatStatistics } from '../analysis/statistics.js';
import { analyzeWordFrequency } from '../analysis/word-analysis.js';
import { analyzeEmojiFrequency } from '../analysis/emoji-analysis.js';
import { renderFormattedText, escapeHTML } from '../utils/sanitizer.js';
import { getSenderColor } from './chat-view.js';

export class StatisticsView {
  /**
   * @param {HTMLElement} containerElement 
   */
  constructor(containerElement) {
    this.container = containerElement;
  }

  /**
   * Render dashboard for active chat.
   * @param {import('../models/chat.js').Chat} chat 
   */
  render(chat) {
    if (!chat || chat.messages.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <h3>No chat data loaded</h3>
          <p>Upload a WhatsApp export to view comprehensive chat statistics.</p>
        </div>
      `;
      return;
    }

    const stats = computeChatStatistics(chat);
    if (!stats) return;

    const topWords = analyzeWordFrequency(chat.messages, { limit: 30 });
    const topEmojis = analyzeEmojiFrequency(chat.messages, 30);

    const { overview, participants, activity, insights, mediaBreakdown } = stats;

    this.container.innerHTML = `
      <div class="stats-dashboard">
        <!-- Overview Grid -->
        <section class="stats-section">
          <h2 class="stats-title">📊 Overview Summary</h2>
          <div class="overview-grid">
            <div class="stat-card">
              <span class="stat-value">${overview.totalMessages.toLocaleString()}</span>
              <span class="stat-label">Total Messages</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${overview.totalParticipants}</span>
              <span class="stat-label">Participants</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${overview.activeDaysCount.toLocaleString()}</span>
              <span class="stat-label">Active Days</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${overview.avgMessagesPerActiveDay}</span>
              <span class="stat-label">Avg Messages / Active Day</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${overview.durationText}</span>
              <span class="stat-label">Chat Duration</span>
            </div>
          </div>
        </section>

        <!-- Participants Table -->
        <section class="stats-section">
          <h2 class="stats-title">👥 Participant Breakdown</h2>
          <div class="table-container">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Messages</th>
                  <th>Share (%)</th>
                  <th>Words</th>
                  <th>Characters</th>
                  <th>Avg Length</th>
                </tr>
              </thead>
              <tbody>
                ${participants.map(p => {
                  const color = getSenderColor(p.name);
                  return `
                    <tr>
                      <td class="participant-cell">
                        <span class="color-dot" style="background-color: ${color}"></span>
                        <strong>${escapeHTML(p.name)}</strong>
                      </td>
                      <td>${p.messageCount.toLocaleString()}</td>
                      <td>
                        <div class="progress-bar-container">
                          <div class="progress-bar-fill" style="width: ${p.percentage}%; background-color: ${color}"></div>
                          <span>${p.percentage}%</span>
                        </div>
                      </td>
                      <td>${p.wordCount.toLocaleString()}</td>
                      <td>${p.characterCount.toLocaleString()}</td>
                      <td>${p.avgMessageLength} chars</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Activity Charts Section -->
        <section class="stats-section">
          <h2 class="stats-title">📈 Activity Breakdown</h2>
          <div class="charts-grid">
            <!-- Messages by Day of Week -->
            <div class="chart-card">
              <h3>Messages by Day of Week</h3>
              <div class="bar-chart-vertical">
                ${this.renderVerticalBarChart(activity.byDayOfWeek.map(d => ({ label: d.day, value: d.count })))}
              </div>
            </div>

            <!-- Messages by Hour -->
            <div class="chart-card">
              <h3>Messages by Hour of Day (00-23h)</h3>
              <div class="bar-chart-vertical">
                ${this.renderVerticalBarChart(activity.byHour.map(h => ({ label: h.hour.replace(':00', ''), value: h.count })))}
              </div>
            </div>
          </div>

          <!-- Monthly Timeline Chart -->
          ${activity.monthlyTimeline.length > 1 ? `
            <div class="chart-card full-width">
              <h3>Monthly Activity Timeline</h3>
              <div class="bar-chart-horizontal">
                ${this.renderHorizontalBarChart(activity.monthlyTimeline.map(m => ({ label: m.label, value: m.count })))}
              </div>
            </div>
          ` : ''}
        </section>

        <!-- Conversation Insights & Media -->
        <div class="two-column-grid">
          <section class="stats-section">
            <h2 class="stats-title">💡 Conversation Insights</h2>
            <div class="insights-list">
              <div class="insight-item">
                <span class="insight-icon">🏆</span>
                <div class="insight-text">
                  <strong>Most Active Participant:</strong> ${insights.mostActiveParticipant ? escapeHTML(insights.mostActiveParticipant.name) : 'N/A'} (${insights.mostActiveParticipant ? insights.mostActiveParticipant.messageCount.toLocaleString() : 0} messages)
                </div>
              </div>
              <div class="insight-item">
                <span class="insight-icon">📅</span>
                <div class="insight-text">
                  <strong>Peak Active Day:</strong> ${insights.mostActiveDay ? `${insights.mostActiveDay.date} (${insights.mostActiveDay.count.toLocaleString()} msgs)` : 'N/A'}
                </div>
              </div>
              <div class="insight-item">
                <span class="insight-icon">⏰</span>
                <div class="insight-text">
                  <strong>Peak Hour:</strong> ${insights.mostActiveHour.hour} (${insights.mostActiveHour.count.toLocaleString()} msgs)
                </div>
              </div>
              <div class="insight-item">
                <span class="insight-icon">🔗</span>
                <div class="insight-text">
                  <strong>Shared Links:</strong> ${insights.totalLinks.toLocaleString()} links
                </div>
              </div>
              <div class="insight-item">
                <span class="insight-icon">🛡️</span>
                <div class="insight-text">
                  <strong>System Notifications:</strong> ${insights.totalSystemMessages.toLocaleString()} events
                </div>
              </div>
              ${insights.longestMessage.sender ? `
                <div class="insight-item">
                  <span class="insight-icon">📜</span>
                  <div class="insight-text">
                    <strong>Longest Message:</strong> ${escapeHTML(insights.longestMessage.sender)} (${insights.longestMessage.length.toLocaleString()} characters)
                  </div>
                </div>
              ` : ''}
            </div>
          </section>

          <!-- Media Stats Breakdown -->
          <section class="stats-section">
            <h2 class="stats-title">📁 Media Statistics</h2>
            <div class="media-stats-grid">
              <div class="media-stat-item">
                <span class="media-stat-icon">📷</span>
                <span class="media-stat-count">${mediaBreakdown.image.toLocaleString()}</span>
                <span class="media-stat-label">Images</span>
              </div>
              <div class="media-stat-item">
                <span class="media-stat-icon">🎥</span>
                <span class="media-stat-count">${mediaBreakdown.video.toLocaleString()}</span>
                <span class="media-stat-label">Videos</span>
              </div>
              <div class="media-stat-item">
                <span class="media-stat-icon">🎵</span>
                <span class="media-stat-count">${mediaBreakdown.audio.toLocaleString()}</span>
                <span class="media-stat-label">Audio</span>
              </div>
              <div class="media-stat-item">
                <span class="media-stat-icon">📄</span>
                <span class="media-stat-count">${mediaBreakdown.document.toLocaleString()}</span>
                <span class="media-stat-label">Documents</span>
              </div>
              <div class="media-stat-item">
                <span class="media-stat-icon">📎</span>
                <span class="media-stat-count">${mediaBreakdown.other.toLocaleString()}</span>
                <span class="media-stat-label">Other Media</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Words and Emoji Leaderboards -->
        <div class="two-column-grid">
          <section class="stats-section">
            <h2 class="stats-title">🔤 Most Used Words</h2>
            <div class="table-container small-table">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Word</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${topWords.map(w => `
                    <tr>
                      <td><code>${escapeHTML(w.word)}</code></td>
                      <td>${w.count.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>

          <section class="stats-section">
            <h2 class="stats-title">😃 Emoji Leaderboard</h2>
            <div class="table-container small-table">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Emoji</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${topEmojis.map(e => `
                    <tr>
                      <td class="emoji-cell">${e.emoji}</td>
                      <td>${e.count.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  renderVerticalBarChart(data) {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data.map(d => d.value)) || 1;

    return `
      <div class="v-chart-container">
        ${data.map(d => {
          const heightPct = Math.round((d.value / max) * 100);
          return `
            <div class="v-bar-col" title="${d.label}: ${d.value.toLocaleString()}">
              <div class="v-bar-fill" style="height: ${heightPct}%"></div>
              <span class="v-bar-label">${d.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderHorizontalBarChart(data) {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data.map(d => d.value)) || 1;

    return `
      <div class="h-chart-container">
        ${data.map(d => {
          const widthPct = Math.round((d.value / max) * 100);
          return `
            <div class="h-bar-row">
              <span class="h-bar-label">${d.label}</span>
              <div class="h-bar-track">
                <div class="h-bar-fill" style="width: ${widthPct}%"></div>
              </div>
              <span class="h-bar-value">${d.value.toLocaleString()}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}
