/**
 * Media Placeholder Detection & Media Type Mapping.
 */

const MEDIA_KEYWORDS = [
  '<media omitted>',
  'media omitted',
  '<media omitted',
  'image omitted',
  'video omitted',
  'audio omitted',
  'sticker omitted',
  'document omitted',
  'gif omitted',
  'voice note omitted',
  'file attached',
  '(file attached)'
];

/**
 * Checks if a message text is a media placeholder or attachment reference.
 * @param {string} text 
 * @returns {boolean}
 */
export function isMediaPlaceholder(text) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  
  if (MEDIA_KEYWORDS.some(kw => lower.includes(kw))) {
    return true;
  }

  // Regex patterns matching WhatsApp file attachment placeholders e.g. "IMG-20240315-WA0001.jpg (file attached)"
  if (/\.(jpg|jpeg|png|gif|webp|mp4|mov|m4a|mp3|ogg|opus|aac|pdf|doc|docx|xls|xlsx|zip)\b.*file attached/i.test(text)) {
    return true;
  }

  return false;
}

/**
 * Classifies media type from text or filename.
 * @param {string} text 
 * @param {string} [filename]
 * @returns {'image' | 'video' | 'audio' | 'document' | 'other' | 'unknown'}
 */
export function classifyMediaType(text, filename = '') {
  const combined = `${text || ''} ${filename || ''}`.toLowerCase();

  if (/\b(image|photo|picture|sticker|jpg|jpeg|png|gif|webp)\b/i.test(combined) || /^img-/i.test(filename)) {
    return 'image';
  }
  if (/\b(video|movie|mp4|mov|webm|3gp)\b/i.test(combined) || /^vid-/i.test(filename)) {
    return 'video';
  }
  if (/\b(audio|voice|sound|m4a|mp3|ogg|opus|aac|wav)\b/i.test(combined) || /^aud-/i.test(filename) || /^ptt-/i.test(filename)) {
    return 'audio';
  }
  if (/\b(document|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)\b/i.test(combined) || /^doc-/i.test(filename)) {
    return 'document';
  }

  return 'other';
}

/**
 * Returns emoji icon corresponding to media type.
 * @param {string} mediaType 
 * @returns {string} E.g., "📷", "🎥", "🎵", "📄", "📎"
 */
export function getMediaIcon(mediaType) {
  switch (mediaType) {
    case 'image': return '📷';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    default: return '📎';
  }
}
