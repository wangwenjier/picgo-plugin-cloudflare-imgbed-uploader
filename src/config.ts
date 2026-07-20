import { IConfig, FormField } from './types';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: IConfig = {
  // Authentication
  baseUrl: '',
  authCode: '',
  apiToken: '',

  // Upload options
  uploadChannel: 'telegram',
  uploadFolder: '',
  uploadNameType: 'default',
  serverCompress: 'false',
  autoRetry: 'false',

  // URL handling
  customDomain: '',
};

/**
 * Merge user config with defaults, filling in any missing values.
 */
export function mergeConfig(userConfig: Partial<IConfig>): IConfig {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Normalize baseUrl: strip trailing slash
  if (config.baseUrl) {
    config.baseUrl = config.baseUrl.replace(/\/+$/, '');
  }

  // Normalize customDomain: strip trailing slash
  if (config.customDomain) {
    config.customDomain = config.customDomain.replace(/\/+$/, '');
  }

  return config;
}

/**
 * Validate configuration and return list of error messages.
 * Empty array means configuration is valid.
 */
export function validateConfig(config: IConfig): string[] {
  const errors: string[] = [];

  if (!config.baseUrl || config.baseUrl.trim() === '') {
    errors.push('Base URL is required (e.g. https://img.example.com)');
  }

  // Validate baseUrl format
  if (config.baseUrl && !/^https?:\/\/.+/.test(config.baseUrl)) {
    errors.push('Base URL must start with http:// or https://');
  }

  return errors;
}

/**
 * Build PicGo GUI form field definitions for plugin configuration.
 */
export function getConfigFields(userConfig?: Partial<IConfig>): FormField[] {
  const cfg: IConfig = { ...DEFAULT_CONFIG, ...userConfig };

  return [
    // ── 认证配置 ──
    {
      name: 'baseUrl',
      type: 'input',
      required: true,
      default: cfg.baseUrl,
      alias: '站点地址',
      message: 'Cloudflare ImgBed 部署地址，例如 https://img.example.com（不含 /upload 后缀）',
    },
    {
      name: 'authCode',
      type: 'password',
      required: false,
      default: cfg.authCode,
      alias: '认证码',
      message: '上传认证码（在 ImgBed 管理面板「系统设置 → 网页设置 → 全局设置」中配置）。使用 API Token 则可留空',
    },
    {
      name: 'apiToken',
      type: 'password',
      required: false,
      default: cfg.apiToken,
      alias: 'API Token',
      message: '具有 upload 权限的 API Token（Bearer 认证方式）。与认证码二选一即可',
    },

    // ── 上传选项 ──
    {
      name: 'uploadChannel',
      type: 'list',
      required: false,
      default: cfg.uploadChannel,
      alias: '上传渠道（确认已选渠道在平台中已配置）',
      message: '选择文件存储的后端渠道',
      choices: [
        { name: 'Telegram', value: 'telegram' },
        { name: 'CloudFlare R2', value: 'cfr2' },
        { name: 'S3', value: 's3' },
        { name: 'Discord', value: 'discord' },
        { name: 'HuggingFace', value: 'huggingface' },
        { name: 'WebDAV', value: 'webdav' },
      ],
    },
    {
      name: 'uploadFolder',
      type: 'input',
      required: false,
      default: cfg.uploadFolder,
      alias: '上传目录（支持占位符：{year} {month} {day} {hour} {minute} {second}）',
      message: '上传文件存放的相对路径，例如 img/{year}/{month}（留空则存放至根目录 /）',
    },
    {
      name: 'uploadNameType',
      type: 'list',
      required: false,
      default: cfg.uploadNameType,
      alias: '命名策略',
      message: '服务器端的文件命名方式',
      choices: [
        { name: '默认（前缀_原名）', value: 'default' },
        { name: '仅前缀', value: 'index' },
        { name: '仅原名', value: 'origin' },
        { name: '短链接', value: 'short' },
      ],
    },
    {
      name: 'customDomain',
      type: 'input',
      required: false,
      default: cfg.customDomain,
      alias: '自定义域名（自定义返回链接域名前缀，例如：https://xxx.example.com）',
      message: '填写后返回链接为 "https://xxx.example.com/文件路径"',
    },
    {
      name: 'autoRetry',
      type: 'list',
      required: false,
      default: cfg.autoRetry,
      alias: '自动重试',
      message: '上传失败时是否自动切换渠道重试',
      choices: [
        { name: '开启（失败时自动切换渠道重试）', value: 'true' },
        { name: '关闭', value: 'false' },
      ],
    },
    {
      name: 'serverCompress',
      type: 'list',
      required: false,
      default: cfg.serverCompress,
      alias: '服务端压缩',
      message: '是否开启服务端压缩（仅 Telegram 渠道图片生效）',
      choices: [
        { name: '开启（仅Telegram渠道图片）', value: 'true' },
        { name: '关闭', value: 'false' },
      ],
    },

  ];
}