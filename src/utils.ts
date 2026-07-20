import { IConfig, ImageInfo, UploadResponseItem } from './types';

/**
 * MIME type map by file extension (no external dependency needed).
 */
const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  pdf: 'application/pdf',
};

/**
 * Get MIME type from a filename's extension.
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_MAP[ext] || 'application/octet-stream';
}

/**
 * Resolve payload placeholders in a path string.
 * Supported: {year}, {month}, {day}, {hour}, {minute}, {second}
 */
function resolvePathPayload(path: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return path
    .replace(/\{year\}/g, String(now.getFullYear()))
    .replace(/\{month\}/g, pad(now.getMonth() + 1))
    .replace(/\{day\}/g, pad(now.getDate()))
    .replace(/\{hour\}/g, pad(now.getHours()))
    .replace(/\{minute\}/g, pad(now.getMinutes()))
    .replace(/\{second\}/g, pad(now.getSeconds()));
}

/**
 * Normalize and resolve the uploadFolder config value.
 */
export function resolveUploadFolder(uploadFolder: string): string {
  if (!uploadFolder) return '';
  const resolved = resolvePathPayload(uploadFolder);
  return resolved.startsWith('/') ? resolved : `/${resolved}`;
}

/**
 * Extract image data from a PicGo output item.
 * Handles both raw buffer (from file system) and base64 (from clipboard/URL).
 */
export function extractImageInfo(item: {
  buffer?: Buffer;
  base64Image?: string;
  fileName: string;
}): ImageInfo {
  let body: Buffer;
  let contentType = '';

  if (item.buffer) {
    body = item.buffer;
  } else if (item.base64Image) {
    // Parse data URI: data:image/png;base64,iVBOR...
    const match = item.base64Image.match(/^data:([\w/+\-.]+);base64,/);
    if (match) {
      contentType = match[1];
    }
    const base64Data = item.base64Image.replace(/^data:[\w/+\-.]+;base64,/, '');
    body = Buffer.from(base64Data, 'base64');
  } else {
    throw new Error('No image data found (neither buffer nor base64Image is available)');
  }

  if (!contentType) {
    contentType = getMimeType(item.fileName);
  }

  return {
    body,
    contentType,
    fileName: item.fileName,
  };
}

/**
 * Build the complete upload URL with query parameters.
 */
export function buildUploadUrl(config: IConfig): string {
  const params: string[] = [];

  // Authentication
  if (config.authCode) {
    params.push(`authCode=${encodeURIComponent(config.authCode)}`);
  }

  // Upload options
  if (config.uploadChannel) {
    params.push(`uploadChannel=${encodeURIComponent(config.uploadChannel)}`);
  }
  if (config.uploadNameType) {
    params.push(`uploadNameType=${encodeURIComponent(config.uploadNameType)}`);
  }
  if (config.uploadFolder) {
    const folderPath = resolveUploadFolder(config.uploadFolder);
    params.push(`uploadFolder=${encodeURIComponent(folderPath)}`);
  }

  // Boolean options (only add if non-default or explicitly set)
  if (config.serverCompress !== 'true') {
    params.push('serverCompress=false');
  }
  if (config.autoRetry !== 'true') {
    params.push('autoRetry=false');
  }

  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return `${config.baseUrl}/upload${queryString}`;
}

export function parseResponseAndGetUrl(
  body: string,
  config: IConfig,
): string {
  let data: UploadResponseItem[];

  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`Failed to parse upload response as JSON. Raw response: ${body.slice(0, 200)}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Invalid upload response format. Expected non-empty JSON array. Got: ${body.slice(0, 200)}`);
  }

  const item = data[0];

  if (!item.src) {
    throw new Error(`Upload response is missing "src" field. Response: ${JSON.stringify(item)}`);
  }

  let url: string;

  // 1. User-specified custom domain (highest priority)
  if (config.customDomain) {
    const pathMatch = item.src.match(/^(?:\w+:\/\/[^/]+)?(\/.*)/);
    let path = pathMatch ? pathMatch[1] : item.src;
    if (path.startsWith('/file/')) {
      path = path.slice(5);
    }
    url = `${config.customDomain}${path}`;
  }
  // 2. Server-returned publicUrl
  else if (item.publicUrl) {
    url = item.publicUrl;
  }
  // 3. Fallback: construct from baseUrl + src
  else {
    const srcPath = item.src.startsWith('/') ? item.src : `/${item.src}`;
    url = `${config.baseUrl}${srcPath}`;
  }

  return url;
}
