/**
 * Client-side file reading and ZIP extraction utilities.
 */

/**
 * Reads a text File object in the browser.
 * Tries UTF-8 encoding first, then falls back to ISO-8859-1.
 * @param {File|Blob} file 
 * @param {Function} onProgress Optional progress callback (0..100)
 * @returns {Promise<string>}
 */
export async function readTextFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        resolve(text);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);

    // Read as UTF-8
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Determines MIME type from file extension.
 * @param {string} filename 
 * @returns {string}
 */
export function getMimeType(filename) {
  if (!filename) return 'application/octet-stream';
  const ext = filename.split('.').pop().toLowerCase();
  
  const mimeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
    '3gp': 'video/3gpp',
    'm4a': 'audio/mp4',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg',
    'opus': 'audio/ogg',
    'aac': 'audio/aac',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'zip': 'application/zip'
  };

  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Processes a uploaded ZIP file using JSZip.
 * Extracts `_chat.txt` and generates Blob URLs for extracted media files.
 * @param {File} zipFile 
 * @param {Function} onProgress 
 * @returns {Promise<{ chatText: string, chatFilename: string, mediaMap: Map<string, { blobUrl: string, mimeType: string }> }>}
 */
export async function readZipFile(zipFile, onProgress) {
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip library is not loaded. Cannot process ZIP file.');
  }

  const zip = new window.JSZip();
  const loadedZip = await zip.loadAsync(zipFile);

  const mediaMap = new Map();
  let chatText = null;
  let chatFilename = '_chat.txt';

  const fileEntries = Object.keys(loadedZip.files).filter(name => !loadedZip.files[name].dir);
  const totalFiles = fileEntries.length;
  let processedCount = 0;

  // 1. Locate the main chat txt file
  let chatEntryName = fileEntries.find(name => name.toLowerCase().endsWith('_chat.txt'));
  if (!chatEntryName) {
    // Fallback: look for any .txt file
    chatEntryName = fileEntries.find(name => name.toLowerCase().endsWith('.txt'));
  }

  if (!chatEntryName) {
    throw new Error('No _chat.txt or valid chat text file was found inside this ZIP archive.');
  }

  chatFilename = chatEntryName.split('/').pop();
  chatText = await loadedZip.files[chatEntryName].async('text');

  // 2. Extract media files into memory Blob URLs
  for (const entryName of fileEntries) {
    processedCount++;
    if (onProgress) {
      onProgress(Math.round((processedCount / totalFiles) * 100));
    }

    if (entryName === chatEntryName) continue;

    const baseName = entryName.split('/').pop();
    if (!baseName || baseName.startsWith('.')) continue; // ignore hidden files

    const mimeType = getMimeType(baseName);
    const blob = await loadedZip.files[entryName].async('blob');
    const blobUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));

    mediaMap.set(baseName.toLowerCase(), {
      filename: baseName,
      blobUrl,
      mimeType
    });
  }

  return {
    chatText,
    chatFilename,
    mediaMap
  };
}
