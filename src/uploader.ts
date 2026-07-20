import { IConfig, ImageInfo } from './types';
import { extractImageInfo, buildUploadUrl, parseResponseAndGetUrl } from './utils';

/**
 * Minimal context interface for HTTP request operations.
 * Uses structural typing to avoid depending on picgo types at runtime.
 */
interface ICtx {
  request: (opts: Record<string, unknown>) => Promise<string>;
  log: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  emit: (event: string, data: unknown) => void;
}

interface IUploadCtx extends ICtx {
  output: Array<{
    buffer?: Buffer;
    base64Image?: string;
    fileName: string;
    url?: string;
    imgUrl?: string;
  }>;
}

/**
 * Build formData object for upload requests.
 * Format matches what PicGo's ctx.Request expects.
 */
function buildUploadFormData(imageInfo: ImageInfo): Record<string, unknown> {
  return {
    file: {
      value: imageInfo.body,
      options: { filename: imageInfo.fileName },
    },
  };
}

/**
 * Build HTTP headers for the request.
 */
function buildHeaders(config: IConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'PicGo',
  };

  // API Token authentication (Bearer)
  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`;
  }

  return headers;
}

/**
 * Upload a single image via POST /upload with multipart/form-data.
 */
async function uploadSingle(
  ctx: ICtx,
  imageInfo: ImageInfo,
  config: IConfig,
): Promise<string> {
  const url = buildUploadUrl(config);
  const headers = buildHeaders(config);
  const formData = buildUploadFormData(imageInfo);

  const requestOpts = {
    method: 'POST',
    url,
    headers,
    formData,
  };

  ctx.log.info(`[Cloudflare ImgBed] Uploading ${imageInfo.fileName} to ${url}`);

  const body = await ctx.request(requestOpts);

  const finalUrl = parseResponseAndGetUrl(body, config);
  return finalUrl;
}

/**
 * Upload handler for PicGo's handle function.
 * Iterates over output items, uploads each, and returns results.
 */
export async function handleUpload(
  ctx: IUploadCtx,
  config: IConfig,
): Promise<Array<{ index: number; url: string }>> {
  const results: Array<{ index: number; url: string }> = [];
  const failures: Array<{ fileName: string; error: string }> = [];

  for (let i = 0; i < ctx.output.length; i++) {
    const item = ctx.output[i];

    try {
      // Extract image data
      const imageInfo = extractImageInfo(item);

      // Upload
      const url = await uploadSingle(ctx, imageInfo, config);

      results.push({ index: i, url });

      ctx.log.info(`[Cloudflare ImgBed] Upload success [${i + 1}/${ctx.output.length}]: ${url}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      ctx.log.error(`[Cloudflare ImgBed] Upload failed for ${item.fileName}: ${errMsg}`);
      ctx.emit('notification', {
        title: 'Cloudflare ImgBed 上传失败',
        body: `${item.fileName}: ${errMsg}`,
      });
      failures.push({ fileName: item.fileName, error: errMsg });
    }
  }

  if (failures.length > 0) {
    const summary = failures.map(f => `${f.fileName}: ${f.error}`).join('; ');
    ctx.log.warn(`[Cloudflare ImgBed] ${failures.length}/${ctx.output.length} image(s) failed: ${summary}`);

    if (results.length === 0) {
      throw new Error(`All uploads failed: ${summary}`);
    }

    ctx.log.info(`[Cloudflare ImgBed] ${results.length}/${ctx.output.length} image(s) uploaded successfully, but ${failures.length} failed`);
  }

  return results;
}