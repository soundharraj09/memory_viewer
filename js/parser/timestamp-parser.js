/**
 * Modular Timestamp Pattern Detection and Parsing.
 */

import { normalizeUnicode } from '../utils/unicode.js';

export class TimestampParser {
  /**
   * @param {string} dateMode 'auto' | 'dd/mm' | 'mm/dd'
   */
  constructor(dateMode = 'auto') {
    this.dateMode = dateMode;
    this.detectedFormat = null;
  }

  /**
   * Attempts to parse a timestamp from the start of a line.
   * @param {string} rawLine 
   * @returns {{ date: Date, rawTimestamp: string, remainingText: string } | null}
   */
  parseLine(rawLine) {
    if (!rawLine) return null;
    const line = normalizeUnicode(rawLine);

    // Pattern 1: iOS bracketed format e.g. "[3/15/24, 2:30:18 PM] " or "[15/03/2024, 14:30:18] " or "[2024-03-15, 14:30:18] "
    const iosMatch = line.match(/^\[(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[aApP]\.?[mM]\.?)?)\]\s*(.*)$/);
    if (iosMatch) {
      const dateStr = iosMatch[1];
      const timeStr = iosMatch[2];
      const date = this.parseDateTime(dateStr, timeStr);
      if (date) {
        return {
          date,
          rawTimestamp: `[${dateStr}, ${timeStr}]`,
          remainingText: iosMatch[3]
        };
      }
    }

    // Pattern 2: Android standard format e.g. "3/15/24, 2:30 PM - " or "15/03/2024, 14:30 - " or "15.03.2024, 14:30 - "
    const androidMatch = line.match(/^(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[aApP]\.?[mM]\.?)?)\s*-\s*(.*)$/);
    if (androidMatch) {
      const dateStr = androidMatch[1];
      const timeStr = androidMatch[2];
      const date = this.parseDateTime(dateStr, timeStr);
      if (date) {
        return {
          date,
          rawTimestamp: `${dateStr}, ${timeStr}`,
          remainingText: androidMatch[3]
        };
      }
    }

    // Pattern 3: Generic un-bracketed timestamp without hyphen e.g. "15/03/2024 14:30 "
    const genericMatch = line.match(/^(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[aApP]\.?[mM]\.?)?)\s+(.*)$/);
    if (genericMatch) {
      const dateStr = genericMatch[1];
      const timeStr = genericMatch[2];
      const date = this.parseDateTime(dateStr, timeStr);
      if (date) {
        return {
          date,
          rawTimestamp: `${dateStr}, ${timeStr}`,
          remainingText: genericMatch[3]
        };
      }
    }

    return null;
  }

  /**
   * Helper to parse date string & time string into a valid Date object.
   * @param {string} dateStr e.g. "15/03/2024" or "3/15/24" or "2024-03-15" or "15.03.2024"
   * @param {string} timeStr e.g. "14:30" or "2:30 PM" or "2:30:18 pm"
   * @returns {Date|null}
   */
  parseDateTime(dateStr, timeStr) {
    const timeParts = this.parseTime(timeStr);
    if (!timeParts) return null;

    const { hours, minutes, seconds } = timeParts;

    // Parse date parts
    const delimiter = dateStr.includes('-') ? '-' : dateStr.includes('.') ? '.' : '/';
    const parts = dateStr.split(delimiter).map(p => parseInt(p, 10));

    if (parts.length !== 3 || parts.some(isNaN)) return null;

    let year, month, day;

    if (parts[0] > 1000) {
      // ISO Format YYYY-MM-DD
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    } else {
      // Either DD/MM/YYYY or MM/DD/YYYY
      let partA = parts[0];
      let partB = parts[1];
      year = parts[2];

      if (year < 100) {
        year = year + 2000; // Handle 2-digit years like 24 -> 2024
      }

      if (this.dateMode === 'dd/mm') {
        day = partA;
        month = partB - 1;
      } else if (this.dateMode === 'mm/dd') {
        month = partA - 1;
        day = partB;
      } else {
        // Auto mode or heuristic fallback:
        // If partA > 12, partA must be day (DD/MM)
        if (partA > 12) {
          day = partA;
          month = partB - 1;
        } else if (partB > 12) {
          // If partB > 12, partB must be day (MM/DD)
          month = partA - 1;
          day = partB;
        } else {
          // Default heuristic: standard DD/MM/YYYY in international exports, or MM/DD/YYYY if US
          day = partA;
          month = partB - 1;
        }
      }
    }

    if (month < 0 || month > 11 || day < 1 || day > 31) {
      return null;
    }

    const d = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Helper to parse time string into 24-hour hours, minutes, seconds.
   * @param {string} timeStr 
   * @returns {{ hours: number, minutes: number, seconds: number } | null}
   */
  parseTime(timeStr) {
    if (!timeStr) return null;

    const isPM = /[pP]\.?[mM]\.?/.test(timeStr);
    const isAM = /[aA]\.?[mM]\.?/.test(timeStr);

    const timeOnly = timeStr.replace(/[aApP]\.?[mM]\.?/g, '').trim();
    const parts = timeOnly.split(':').map(p => parseInt(p, 10));

    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;

    let hours = parts[0];
    const minutes = parts[1];
    const seconds = parts[2] && !isNaN(parts[2]) ? parts[2] : 0;

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return null;
    }

    return { hours, minutes, seconds };
  }

  /**
   * Detects date format ambiguity across sample lines.
   * Checks if first segment exceeds 12 (DD/MM) or second segment exceeds 12 (MM/DD).
   * @param {Array<string>} sampleLines 
   * @returns {'dd/mm' | 'mm/dd' | 'unknown'}
   */
  static detectDateModeFromSamples(sampleLines) {
    let ddFirstCount = 0;
    let mmFirstCount = 0;

    for (const rawLine of sampleLines.slice(0, 500)) {
      if (!rawLine) continue;
      const line = normalizeUnicode(rawLine);
      const match = line.match(/(?:^\[?|^)(\d{1,4})[./\- stiffness](\d{1,4})[./\- stiffness](\d{1,4})/);
      if (match) {
        const p1 = parseInt(match[1], 10);
        const p2 = parseInt(match[2], 10);
        if (p1 > 12 && p1 <= 31) {
          ddFirstCount++;
        } else if (p2 > 12 && p2 <= 31) {
          mmFirstCount++;
        }
      }
    }

    if (ddFirstCount > mmFirstCount) return 'dd/mm';
    if (mmFirstCount > ddFirstCount) return 'mm/dd';
    return 'dd/mm'; // Default international export preference
  }
}
