/**
 * Sanitizes a filename by removing bad characters and replacing spaces with underscores
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  // Remove extension temporarily
  const lastDot = filename.lastIndexOf('.')
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename
  const ext = lastDot > 0 ? filename.substring(lastDot) : ''
  
  // Replace spaces with underscores
  let sanitized = name.replace(/\s+/g, '_')
  
  // Remove bad characters: < > : " / \ | ? * and control characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[._]+|[._]+$/g, '')
  
  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'file'
  }
  
  return sanitized + ext
}

/**
 * Validates if a file is a supported media format
 * @param {File} file - File to validate
 * @returns {boolean} - True if supported
 */
export function isSupportedMediaFile(file) {
  const supportedTypes = [
    'video/mp4',
    'video/quicktime', // mov
    'audio/mpeg', // mp3
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'video/x-msvideo', // avi
    'video/webm',
    'audio/webm',
    'audio/ogg',
    'video/ogg',
  ]
  
  // Check MIME type
  if (supportedTypes.includes(file.type)) {
    return true
  }
  
  // Fallback: check extension
  const ext = file.name.toLowerCase().split('.').pop()
  const supportedExts = ['mp4', 'mp3', 'mov', 'wav', 'avi', 'webm', 'ogg', 'm4a', 'aac', 'flac']
  
  return supportedExts.includes(ext)
}

/**
 * Gets file extension from filename
 * @param {string} filename - Filename
 * @returns {string} - Extension (without dot)
 */
export function getFileExtension(filename) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

