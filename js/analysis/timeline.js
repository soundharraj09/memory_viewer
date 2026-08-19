/**
 * Timeline Aggregator for Year/Month Navigation.
 */

import { MONTH_NAMES } from '../utils/date-utils.js';

export class TimelineAggregator {
  /**
   * Generates a nested Year -> Month hierarchy with message counts and first message index.
   * @param {Array<import('../models/message.js').Message>} messages 
   * @returns {Array<{ year: number, count: number, months: Array<{ monthIndex: number, monthName: string, count: number, firstMessageIndex: number }> }>}
   */
  static buildTimeline(messages) {
    if (!messages || messages.length === 0) return [];

    const tree = new Map(); // year -> Map(monthIndex -> { count, firstMessageIndex })

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.timestamp || isNaN(msg.timestamp)) continue;

      const year = msg.timestamp.getFullYear();
      const monthIndex = msg.timestamp.getMonth();

      if (!tree.has(year)) {
        tree.set(year, new Map());
      }

      const yearMap = tree.get(year);
      if (!yearMap.has(monthIndex)) {
        yearMap.set(monthIndex, { count: 1, firstMessageIndex: i });
      } else {
        const entry = yearMap.get(monthIndex);
        entry.count++;
      }
    }

    const result = [];
    const sortedYears = Array.from(tree.keys()).sort((a, b) => b - a); // newest year first

    for (const year of sortedYears) {
      const monthMap = tree.get(year);
      const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => a - b);

      let yearCount = 0;
      const monthsList = sortedMonths.map(monthIndex => {
        const info = monthMap.get(monthIndex);
        yearCount += info.count;
        return {
          monthIndex,
          monthName: MONTH_NAMES[monthIndex],
          count: info.count,
          firstMessageIndex: info.firstMessageIndex
        };
      });

      result.push({
        year,
        count: yearCount,
        months: monthsList
      });
    }

    return result;
  }
}
