# Vercel 部署指南

本文档记录了柒柒の魔法绘本屋项目在 Vercel 上的部署配置和使用说明。

---

## 项目部署信息

| 项目 | 值 |
|------|-----|
| 项目名称 | storybook |
| 正式域名 | https://storybook-gamma-ten.vercel.app |
| GitHub 仓库 | https://github.com/anderuier/qiqi-storybook-platform |
| Vercel 账户 | anderuier |

---

## Vercel 是什么

Vercel 是一个**自动化部署平台**，工作流程如下：

```
开发者写代码 → 推送到 GitHub → Vercel 自动构建 → 部署到全球 CDN → 用户访问
```

使用 Vercel 你不需要：
- 购买/管理服务器
- 配置 Nginx/Apache
- 手动上传文件
- 处理 SSL 证书（Vercel 自动提供 HTTPS）

---

## 自动部署机制

由于项目已连接 GitHub，**每次 `git push` 到 GitHub 后，Vercel 会自动重新部署**。

构建流程：
```
本地源码 → 上传到 Vercel → Vercel 服务器构建 → 自动部署到 CDN
```

你只需要管理源码，构建过程完全在云端完成，不需要关心本地是否有 `dist` 文件夹。

---

## 免费额度（Hobby 计划）

| 项目 | 限制 |
|------|------|
| 带宽 | 100 GB/月 |
| 构建时长 | 6000 分钟/月 |
| Serverless 函数执行 | 100 GB-小时/月 |
| 部署次数 | 无限制 |
| 项目数量 | 无限制 |

对于个人项目和展示网站，免费额度完全够用。

**注意**：Hobby 计划仅限个人非商业用途，商业项目需升级 Pro 计划（$20/月）。

---

## 网址说明

| 类型 | 说明 |
|------|------|
| **项目域名** | `storybook-gamma-ten.vercel.app` - 永久固定，只要项目存在就不会变 |
| 部署预览域名 | `storybook-xxx-anderuiers-projects.vercel.app` - 每次部署生成新的，用于预览 |
| 自定义域名 | 可以免费绑定自己的域名 |

网址可能变化的情况：
- 主动删除项目
- 重命名项目
- 违反 Vercel 服务条款被封禁

---

## 后端功能支持

### Serverless Functions

Vercel 不运行传统的 Express 服务器，但支持 **Serverless Functions**（无服务器函数）：

```
api/
├── generate-story.ts    → https://域名/api/generate-story
├── generate-image.ts    → https://域名/api/generate-image
└── clone-voice.ts       → https://域名/api/clone-voice
```

每个文件就是一个 API 端点，Vercel 会自动处理。

### 限制（Hobby 免费计划）

| 限制项 | 数值 | 影响 |
|--------|------|------|
| **执行时间** | 最长 10 秒 | AI 生成可能超时 |
| 内存 | 1024 MB | 一般够用 |
| 请求体大小 | 4.5 MB | 上传大文件受限 |
| 并发 | 有限制 | 多人同时用可能排队 |

### AI 功能适用性分析

| 功能 | 实现方式 | Vercel 是否适合 |
|------|----------|-----------------|
| AI 故事生成 | 调用 OpenAI/Claude API | 适合（通常 3-8 秒） |
| AI 图片生成 | 调用 DALL-E/Midjourney API | 可能超时（10-30 秒） |
| 语音克隆 | 调用第三方 API | 可能超时 |

### 解决超时问题的方案

1. **流式响应**：故事生成可以用流式输出，边生成边显示
2. **异步处理**：图片生成可以先返回"生成中"，用户稍后刷新查看
3. **升级 Pro**：$20/月，执行时间延长到 60 秒

---

## MVP 阶段架构

如果后端只是「调用外部 AI API」，Vercel 完全够用：

```
用户浏览器
    ↓ 请求
Vercel (前端 + Serverless API)
    ↓ 调用
OpenAI / Replicate / ElevenLabs 等 AI 服务
    ↓ 返回结果
用户看到生成的故事/图片/语音
```

---

## 常用命令

```bash
# 预览部署（生成临时预览链接）
vercel

# 生产部署（发布到正式域名）
vercel --prod

# 查看登录状态
vercel whoami

# 查看环境变量
vercel env ls

# 添加环境变量
vercel env add

# 查看部署日志
vercel logs
```

---

## 项目配置文件

### vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm run build:client",
  "outputDirectory": "dist/public",
  "installCommand": "pnpm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### package.json 构建命令

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts ...",
    "build:client": "vite build"
  }
}
```

- `build`：本地开发用，同时构建前端和后端
- `build:client`：Vercel 部署用，只构建前端

---

## 后期扩展选项

如果遇到瓶颈（用户量大、需要更长执行时间、需要数据库等），可考虑：

| 方案 | 说明 |
|------|------|
| Vercel Pro | $20/月，执行时间延长到 60 秒 |
| Railway / Render | 支持传统后端服务器 |
| 自己的云服务器 | 完全自主控制 |

---

## 总结

| 问题 | 答案 |
|------|------|
| Vercel 是自动化部署工具？ | 是 |
| 推送 GitHub 自动部署？ | 是 |
| 后端 AI 功能能用？ | 能，但有 10 秒超时限制 |
| MVP + 分享给朋友用 Vercel 够吗？ | 完全够 |

---

*创建日期: 2026-01-08*
