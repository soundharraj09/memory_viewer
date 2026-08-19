/**
 * Date formatting and calculation utilities.
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Checks if two dates fall on the same day (Year, Month, Day).
 * @param {Date} d1 
 * @param {Date} d2 
 * @returns {boolean}
 */
export function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formats time portion of Date object as 12-hour H:MM AM/PM string.
 * @param {Date} date 
 * @returns {string} E.g. "8:32 PM"
 */
export function formatTime(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Formats full Date string for message detail inspector (e.g., "15 March 2026, 8:32:14 PM").
 * @param {Date} date 
 * @returns {string}
 */
export function formatFullDateTime(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const time = formatTime(date);
  const seconds = date.getSeconds();
  const secStr = seconds < 10 ? '0' + seconds : seconds;
  return `${day} ${month} ${year}, ${time.replace(' ', `:${secStr} `)}`;
}

/**
 * Formats date header for chat separators (e.g. "Today", "Yesterday", "15 March 2026").
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateHeader(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'Unknown Date';
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Formats short date e.g. "15 Mar 2026".
 * @param {Date} date 
 * @returns {string}
 */
export function formatShortDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Calculates human-readable duration between start and end dates.
 * @param {Date} start 
 * @param {Date} end 
 * @returns {string} E.g., "2 years, 3 months, 12 days" or "45 days"
 */
export function formatDuration(start, end) {
  if (!start || !end || isNaN(start) || isNaN(end)) return '0 days';
  
  const diffMs = Math.abs(end - start);
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays === 0) return '1 day';
  if (totalDays < 30) return `${totalDays} days`;

  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (days > 0 && years === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);

  return parts.join(', ') || `${totalDays} days`;
}

/**
 * Returns YYYY-MM key for grouping timeline entries.
 * @param {Date} date 
 * @returns {string}
 */
export function getMonthYearKey(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export { MONTH_NAMES, MONTH_NAMES_SHORT, DAY_NAMES, DAY_NAMES_SHORT };
