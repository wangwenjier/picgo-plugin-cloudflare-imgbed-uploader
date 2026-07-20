import { IConfig } from './types';
import { mergeConfig, validateConfig, getConfigFields } from './config';
import { handleUpload } from './uploader';

/**
 * PicGo plugin context type (subset of what we use).
 * Uses structural typing to avoid depending on picgo package at runtime.
 */
interface PicGoContext {
  getConfig: (key: string) => unknown;
  helper: {
    uploader: {
      register: (
        id: string,
        opts: {
          handle: (ctx: PicGoContext) => Promise<PicGoContext>;
          config: (ctx: PicGoContext) => unknown;
          name: string;
        },
      ) => void;
    };
  };
  request: (opts: Record<string, unknown>) => Promise<string>;
  log: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  emit: (event: string, data: unknown) => void;
  output: Array<{
    buffer?: Buffer;
    base64Image?: string;
    fileName: string;
    url?: string;
    imgUrl?: string;
  }>;
}

/**
 * Config key used by PicGo to store plugin settings.
 */
const CONFIG_KEY = 'picBed.cloudflare-imgbed-uploader';

/**
 * Plugin entry point. PicGo calls this function with the context object.
 */
module.exports = (ctx: PicGoContext) => {
  /**
   * Config provider: returns form field definitions for the PicGo GUI.
   */
  const config = (_ctx: PicGoContext) => {
    const userConfig = (ctx.getConfig(CONFIG_KEY) || {}) as Partial<IConfig>;
    return getConfigFields(userConfig);
  };

  /**
   * Upload handler: called by PicGo when images need to be uploaded.
   */
  const handle = async (ctx: PicGoContext): Promise<PicGoContext> => {
    // Read and validate configuration
    const rawConfig = ctx.getConfig(CONFIG_KEY) as Partial<IConfig> | undefined;

    if (!rawConfig) {
      throw new Error(
        'cloudflare-imgbed-uploader 插件未配置，请在插件配置中填写 Cloudflare ImgBed 的 Base URL 等信息',
      );
    }

    const config = mergeConfig(rawConfig);

    // Validate config
    const errors = validateConfig(config);
    if (errors.length > 0) {
      const combined = errors.join('; ');
      ctx.emit('notification', {
        title: 'Cloudflare ImgBed 配置错误',
        body: combined,
      });
      throw new Error(`Cloudflare ImgBed config validation failed: ${combined}`);
    }

    ctx.log.info(`[Cloudflare ImgBed] Starting upload: ${ctx.output.length} image(s)`);
    ctx.log.info(`[Cloudflare ImgBed] Channel: ${config.uploadChannel}, Base URL: ${config.baseUrl}`);

    // Execute upload
    const results = await handleUpload(ctx, config);

    // Map results back to PicGo output array
    for (const { index, url } of results) {
      delete ctx.output[index].buffer;
      delete ctx.output[index].base64Image;
      ctx.output[index].url = url;
      ctx.output[index].imgUrl = url;
    }

    ctx.log.info(`[Cloudflare ImgBed] All ${results.length} image(s) uploaded successfully`);
    return ctx;
  };

  /**
   * Register the uploader with PicGo.
   */
  const register = () => {
    ctx.helper.uploader.register('cloudflare-imgbed-uploader', {
      handle,
      config,
      name: 'cloudflare-imgbed-uploader',
    });
  };

  return { register };
};
