/**
 * Comprehensive Chat Statistics Analyzer (High Performance Vectorized).
 */

import { formatDuration, DAY_NAMES, MONTH_NAMES_SHORT } from '../utils/date-utils.js';

export function computeChatStatistics(chat) {
  const messages = chat.messages || [];
  if (messages.length === 0) return null;

  const startDate = chat.startDate;
  const endDate = chat.endDate;
  const totalMessages = messages.length;

  const activeDaysSet = new Set();
  const messagesByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  const messagesByHour = new Array(24).fill(0);
  const messagesByMonthMap = new Map();
  const messagesByDateString = new Map();

  let totalSystemMessages = 0;
  let totalMediaMessages = 0;
  let totalLinks = 0;

  const mediaBreakdown = {
    image: 0,
    video: 0,
    audio: 0,
    document: 0,
    other: 0
  };

  const participantStatsMap = new Map();
  chat.participants.forEach(p => {
    participantStatsMap.set(p, {
      name: p,
      messageCount: 0,
      wordCount: 0,
      characterCount: 0,
      firstMessageDate: null,
      lastMessageDate: null,
      dateCounts: new Map(),
      mediaCount: 0,
      linkCount: 0
    });
  });

  let longestMessage = {
    sender: null,
    text: '',
    length: 0,
    date: null
  };

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const ts = msg.timestamp;

    if (ts && !isNaN(ts.getTime())) {
      const y = ts.getFullYear();
      const m = ts.getMonth() + 1;
      const d = ts.getDate();
      const dateNum = y * 10000 + m * 100 + d;
      const monthNum = y * 100 + m;

      const dayOfWeek = ts.getDay();
      const hour = ts.getHours();

      activeDaysSet.add(dateNum);
      messagesByDayOfWeek[dayOfWeek]++;
      messagesByHour[hour]++;

      messagesByMonthMap.set(monthNum, (messagesByMonthMap.get(monthNum) || 0) + 1);
      messagesByDateString.set(dateNum, (messagesByDateString.get(dateNum) || 0) + 1);
    }

    if (msg.isSystem) {
      totalSystemMessages++;
    }

    if (msg.isMedia) {
      totalMediaMessages++;
      const mType = msg.media ? msg.media.mediaType : 'other';
      if (mediaBreakdown[mType] !== undefined) {
        mediaBreakdown[mType]++;
      } else {
        mediaBreakdown.other++;
      }
    }

    if (msg.links && msg.links.length > 0) {
      totalLinks += msg.links.length;
    }

    if (msg.sender && participantStatsMap.has(msg.sender)) {
      const pStat = participantStatsMap.get(msg.sender);
      pStat.messageCount++;
      pStat.wordCount += msg.wordCount;
      pStat.characterCount += msg.characterCount;
      if (!pStat.firstMessageDate) pStat.firstMessageDate = ts;
      pStat.lastMessageDate = ts;

      if (msg.isMedia) pStat.mediaCount++;
      if (msg.links && msg.links.length > 0) pStat.linkCount += msg.links.length;

      if (ts && !isNaN(ts.getTime())) {
        const y = ts.getFullYear();
        const m = ts.getMonth() + 1;
        const d = ts.getDate();
        const dateNum = y * 10000 + m * 100 + d;
        pStat.dateCounts.set(dateNum, (pStat.dateCounts.get(dateNum) || 0) + 1);
      }

      if (msg.characterCount > longestMessage.length) {
        longestMessage = {
          sender: msg.sender,
          text: msg.text,
          length: msg.characterCount,
          date: ts
        };
      }
    }
  }

  const activeDaysCount = activeDaysSet.size || 1;
  const avgMessagesPerActiveDay = (totalMessages / activeDaysCount).toFixed(1);

  let mostActiveDayKey = null;
  let maxDayCount = 0;
  for (const [dNum, count] of messagesByDateString.entries()) {
    if (count > maxDayCount) {
      maxDayCount = count;
      mostActiveDayKey = dNum;
    }
  }

  let formattedMostActiveDay = null;
  if (mostActiveDayKey) {
    const y = Math.floor(mostActiveDayKey / 10000);
    const m = Math.floor((mostActiveDayKey % 10000) / 100);
    const d = mostActiveDayKey % 100;
    formattedMostActiveDay = `${d} ${MONTH_NAMES_SHORT[m - 1]} ${y}`;
  }

  let mostActiveHour = 0;
  let maxHourCount = 0;
  messagesByHour.forEach((count, h) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      mostActiveHour = h;
    }
  });

  const participantList = Array.from(participantStatsMap.values()).map(p => {
    const percentage = totalMessages > 0 ? ((p.messageCount / totalMessages) * 100).toFixed(1) : '0';
    const avgLen = p.messageCount > 0 ? Math.round(p.characterCount / p.messageCount) : 0;

    let pMostActiveDayKey = null;
    let pMaxDayCount = 0;
    for (const [dNum, count] of p.dateCounts.entries()) {
      if (count > pMaxDayCount) {
        pMaxDayCount = count;
        pMostActiveDayKey = dNum;
      }
    }

    let pFormattedActiveDay = null;
    if (pMostActiveDayKey) {
      const y = Math.floor(pMostActiveDayKey / 10000);
      const m = Math.floor((pMostActiveDayKey % 10000) / 100);
      const d = pMostActiveDayKey % 100;
      pFormattedActiveDay = `${d} ${MONTH_NAMES_SHORT[m - 1]} ${y}`;
    }

    return {
      name: p.name,
      messageCount: p.messageCount,
      percentage: Number(percentage),
      wordCount: p.wordCount,
      characterCount: p.characterCount,
      avgMessageLength: avgLen,
      firstMessageDate: p.firstMessageDate,
      lastMessageDate: p.lastMessageDate,
      mostActiveDay: pFormattedActiveDay,
      mediaCount: p.mediaCount,
      linkCount: p.linkCount
    };
  }).sort((a, b) => b.messageCount - a.messageCount);

  const monthlyTimeline = Array.from(messagesByMonthMap.entries())
    .map(([monthNum, count]) => {
      const y = Math.floor(monthNum / 100);
      const m = monthNum % 100;
      const label = `${MONTH_NAMES_SHORT[m - 1]} ${y}`;
      return { monthNum, label, count };
    })
    .sort((a, b) => a.monthNum - b.monthNum);

  return {
    overview: {
      totalMessages,
      totalParticipants: chat.participants.length,
      startDate,
      endDate,
      durationText: formatDuration(startDate, endDate),
      activeDaysCount,
      avgMessagesPerActiveDay
    },
    participants: participantList,
    activity: {
      byDayOfWeek: DAY_NAMES.map((name, i) => ({ day: name.slice(0, 3), count: messagesByDayOfWeek[i] })),
      byHour: messagesByHour.map((count, h) => ({ hour: `${h}:00`, count })),
      monthlyTimeline
    },
    insights: {
      mostActiveParticipant: participantList.length > 0 ? participantList[0] : null,
      mostActiveDay: formattedMostActiveDay ? { date: formattedMostActiveDay, count: maxDayCount } : null,
      mostActiveHour: { hour: `${mostActiveHour}:00`, count: maxHourCount },
      longestMessage,
      avgMessagesPerActiveDay,
      totalLinks,
      totalMediaMessages,
      totalSystemMessages
    },
    mediaBreakdown
  };
}
