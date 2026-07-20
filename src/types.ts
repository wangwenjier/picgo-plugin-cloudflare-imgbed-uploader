/** Supported upload channels */
export type UploadChannel = 'telegram' | 'cfr2' | 's3' | 'discord' | 'huggingface' | 'webdav';

/** File naming strategies */
export type UploadNameType = 'default' | 'index' | 'origin' | 'short';

/** Plugin configuration interface */
export interface IConfig {
  // Authentication
  baseUrl: string;
  authCode: string;
  apiToken: string;

  // Upload options
  uploadChannel: UploadChannel;
  uploadFolder: string;
  uploadNameType: UploadNameType;
  serverCompress: string; // 'true' | 'false'
  autoRetry: string;      // 'true' | 'false'

  // URL handling
  customDomain: string;
}

/** Upload response from Cloudflare Image Bed API */
export interface UploadResponseItem {
  src: string;
  publicUrl?: string;
}

/** Extracted image data ready for upload */
export interface ImageInfo {
  body: Buffer;
  contentType: string;
  fileName: string;
}

/** PicGo form field definition for GUI config */
export interface FormField {
  name: string;
  type: 'input' | 'password' | 'list' | 'confirm';
  required: boolean;
  default?: unknown;
  message?: string;
  alias?: string;
  choices?: Array<{ name: string; value: string }>;
}
