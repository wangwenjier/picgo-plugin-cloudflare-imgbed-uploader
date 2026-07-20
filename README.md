# picgo-plugin-cloudflare-imgbed-uploader

PicGo 上传器插件，用于 [CloudFlare ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed) —— 一个开源自托管图床服务。

## 特性

- ✅ **完整的 API 支持** — 覆盖 CloudFlare ImgBed 上传 API 的全部参数
- 🔐 **双重认证** — 支持 上传密码 和 API Token（含上传权限）
- 📡 **多通道上传** — 支持 Telegram、Cloudflare R2、S3、Discord、HuggingFace、WebDAV
- 📝 **灵活命名** — 4 种文件命名方式：default（前缀_原名）、index（仅前缀）、origin（仅原名）、short（短链接）
- 📁 **上传目录** — 支持占位符动态配置 `{year}` `{month}` `{day}` `{hour}` `{minute}` `{second}`
- 🌐 **自定义域名** — 支持 CDN / 自定义域名替换，自动处理路径拼接
- 🔄 **自动重试** — 上传失败时自动切换通道重试
- 🔧 **TypeScript** — 完整类型定义，零运行时依赖

## 安装

### PicGo GUI

在 PicGo 的"插件设置"中搜索 `picgo-plugin-cloudflare-imgbed-uploader` 并安装。

### 手动安装

```bash
# 进入 PicGo 插件目录
cd ~/.picgo/
npm install picgo-plugin-cloudflare-imgbed-uploader
```

## 配置说明

在 PicGo 的"图床设置"中选择 "cloudflare-imgbed-uploader"，配置以下参数：

### 认证（至少填一项）

| 参数  | 说明 |
|------|------|
| **站点地址** (baseUrl) | Cloudflare ImgBed 部署地址，如 `https://img.example.com`（不含 `/upload` 后缀） |
| **API Token** | 具有 `upload` 权限的 API Token（Bearer 认证方式） |
| **认证码** | 上传认证码（在 ImgBed 管理面板「系统设置 → 网页设置 → 全局设置」中配置） |

### 上传选项

| 参数 |  默认值 | 说明 |
|------|--------|------|
| **上传渠道** (uploadChannel) | Telegram | 存储后端：Telegram / R2 / S3 / Discord / HuggingFace / WebDAV |
| **上传目录** (uploadFolder) | — | 上传路径，支持占位符 `{year}` `{month}` `{day}` `{hour}` `{minute}` `{second}` |
| **命名策略** (uploadNameType) | 默认 | `默认（前缀_原名）` / `仅前缀` / `仅原名` / `短链接` |

### URL 处理

| 参数 | 说明 |
|------|------|
| **自定义域名** (customDomain) | 自定义返回链接的域名前缀，如 `https://cdn.example.com` |

### 高级选项

| 参数 | 默认值 | 说明 |
|------|--------|------|
| **自动重试** (autoRetry) | 关闭 | 上传失败时是否自动切换渠道重试 |
| **服务端压缩** (serverCompress) | 关闭 | 是否开启服务端压缩（仅 Telegram 渠道生效） |

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式（watch）
npm run dev
```

## License

MIT

## 参考

- [CloudFlare-ImgBed 项目](https://github.com/MarSeventh/CloudFlare-ImgBed)
- [CloudFlare-ImgBed 官方文档](https://cfbed.sanyue.de/)
- [PicGo 插件开发文档](https://docs.picgo.app/zh/core/dev-guide/gui)