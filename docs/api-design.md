# 柒柒の魔法绘本屋 - API 接口设计文档

> 版本：v1.0
> 更新日期：2026-01-09
> 状态：设计阶段

---

## 目录

1. [概述](#概述)
2. [通用规范](#通用规范)
3. [用户系统 API](#一用户系统-api)
4. [故事创作 API](#二故事创作-api核心)
5. [作品管理 API](#三作品管理-api)
6. [模板系统 API](#四模板系统-api)
7. [社区发布 API](#五社区发布-api)
8. [错误码定义](#六错误码定义)

---

## 概述

### 创作流程

```
┌─────────────────────────────────────────────────────────────┐
│                      用户创作流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 输入创意/选择模板                                        │
│         ↓                                                   │
│  2. AI 生成完整故事文本        POST /api/create/story       │
│         ↓                                                   │
│  3. AI 拆分为分镜剧本          POST /api/create/storyboard  │
│         ↓                                                   │
│  4. AI 生成分镜图片            POST /api/create/images      │
│         ↓                                                   │
│  5. 生成配音                   POST /api/create/voice       │
│         ↓                                                   │
│  6. 合成电子绘本               POST /api/create/compile     │
│         ↓                                                   │
│  7. 预览 → 保存/发布                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API 统计

| 模块 | 接口数量 |
|------|----------|
| 用户系统 | 7 个 |
| 故事创作 | 8 个 |
| 作品管理 | 6 个 |
| 模板系统 | 3 个 |
| 社区发布 | 6 个 |
| **合计** | **30 个** |

---

## 通用规范

### 基础 URL

- 开发环境：`http://localhost:3000/api`
- 生产环境：`https://storybook-gamma-ten.vercel.app/api`

### 请求格式

- Content-Type: `application/json`
- 文件上传: `multipart/form-data`

### 认证方式

- 使用 JWT Token
- 请求头：`Authorization: Bearer <token>`
- Token 有效期：7 天

### 统一响应格式

```typescript
// 成功响应
{
  success: true,
  data: { ... }
}

// 错误响应
{
  success: false,
  error: {
    code: string,        // 错误码
    message: string      // 错误信息
  }
}
```

### 分页参数

```typescript
// 请求
{
  page?: number,         // 页码，默认 1
  pageSize?: number      // 每页数量，默认 10，最大 50
}

// 响应
{
  total: number,         // 总数
  page: number,          // 当前页
  pageSize: number,      // 每页数量
  data: [...]            // 数据列表
}
```

---

## 一、用户系统 API

### 1.1 用户注册

**POST** `/api/auth/register`

```typescript
// 请求
{
  email: string,         // 邮箱
  password: string,      // 密码（6-20位）
  nickname: string       // 昵称（2-20字符）
}

// 响应
{
  success: true,
  data: {
    userId: string,
    email: string,
    nickname: string,
    token: string        // JWT token
  }
}
```

### 1.2 用户登录

**POST** `/api/auth/login`

```typescript
// 请求
{
  email: string,
  password: string
}

// 响应
{
  success: true,
  data: {
    userId: string,
    email: string,
    nickname: string,
    avatar: string,
    token: string
  }
}
```

### 1.3 第三方登录

**POST** `/api/auth/oauth`

```typescript
// 请求
{
  provider: "google" | "wechat",
  code: string           // OAuth 授权码
}

// 响应
{
  success: true,
  data: {
    userId: string,
    email: string,
    nickname: string,
    avatar: string,
    token: string,
    isNewUser: boolean   // 是否新用户
  }
}
```

### 1.4 退出登录

**POST** `/api/auth/logout`

```typescript
// 请求头
Authorization: Bearer <token>

// 响应
{
  success: true,
  data: {
    message: "已退出登录"
  }
}
```

### 1.5 获取当前用户信息

**GET** `/api/user/me`

```typescript
// 请求头
Authorization: Bearer <token>

// 响应
{
  success: true,
  data: {
    userId: string,
    email: string,
    nickname: string,
    avatar: string,
    createdAt: string,
    stats: {
      worksCount: number,      // 作品数量
      publishedCount: number   // 已发布数量
    }
  }
}
```

### 1.6 更新用户信息

**PUT** `/api/user/me`

```typescript
// 请求
{
  nickname?: string,
  avatar?: string        // 头像 URL
}

// 响应
{
  success: true,
  data: {
    userId: string,
    nickname: string,
    avatar: string
  }
}
```

### 1.7 修改密码

**PUT** `/api/user/password`

```typescript
// 请求
{
  oldPassword: string,
  newPassword: string
}

// 响应
{
  success: true,
  data: {
    message: "密码修改成功"
  }
}
```

---

## 二、故事创作 API（核心）

### 2.1 生成故事文本

**POST** `/api/create/story`

> AI 根据用户输入生成完整故事

```typescript
// 请求
{
  mode: "free" | "template",     // 自由创作 / 模板创作
  templateId?: string,           // 模板ID（模板模式必填）
  input: {
    childName: string,           // 孩子名字
    childAge: number,            // 孩子年龄（3-6）
    theme?: string,              // 主题（自由模式）
    keywords?: string[],         // 关键词
    style: string,               // 故事风格：温馨、冒险、搞笑、教育
    length: "short" | "medium" | "long"  // 故事长度
  }
}

// 响应
{
  success: true,
  data: {
    storyId: string,             // 故事ID（用于后续流程）
    title: string,               // 故事标题
    content: string,             // 完整故事文本
    wordCount: number,           // 字数
    estimatedPages: number       // 预估页数
  }
}
```

**故事长度说明**：
| 长度 | 字数范围 | 预估页数 |
|------|----------|----------|
| short | 200-400字 | 4-6页 |
| medium | 400-800字 | 6-10页 |
| long | 800-1200字 | 10-15页 |

### 2.2 生成分镜剧本

**POST** `/api/create/storyboard`

> 将完整故事拆分为分镜剧本

```typescript
// 请求
{
  storyId: string,               // 故事ID
  pageCount?: number             // 指定页数（可选，默认自动）
}

// 响应
{
  success: true,
  data: {
    storyboardId: string,
    title: string,
    pages: [
      {
        pageNumber: number,      // 页码
        text: string,            // 该页朗读文字
        imagePrompt: string,     // 图片生成提示词（英文）
        duration: number         // 预估朗读时长（秒）
      }
    ]
  }
}
```

### 2.3 生成单张分镜图片

**POST** `/api/create/image`

> 生成单张分镜图片，支持重新生成

```typescript
// 请求
{
  storyboardId: string,
  pageNumber: number,
  style: string,                 // 画风：watercolor, cartoon, oil, anime
  regenerate?: boolean           // 是否重新生成（默认 false）
}

// 响应
{
  success: true,
  data: {
    imageId: string,
    imageUrl: string,
    pageNumber: number,
    style: string
  }
}
```

**画风选项**：
| 值 | 说明 |
|-----|------|
| watercolor | 水彩风格 |
| cartoon | 卡通风格 |
| oil | 油画风格 |
| anime | 动漫风格 |
| flat | 扁平插画 |
| 3d | 3D 渲染 |

### 2.4 批量生成图片

**POST** `/api/create/images`

> 批量生成所有分镜图片（异步任务）

```typescript
// 请求
{
  storyboardId: string,
  style: string
}

// 响应
{
  success: true,
  data: {
    taskId: string,              // 任务ID
    status: "processing",
    totalPages: number
  }
}
```

### 2.5 查询异步任务状态

**GET** `/api/create/task/:taskId`

> 查询图片生成、配音等异步任务的进度

```typescript
// 响应
{
  success: true,
  data: {
    taskId: string,
    type: "images" | "voice",
    status: "processing" | "completed" | "failed",
    progress: number,            // 0-100
    completedItems: number,
    totalItems: number,
    results?: [                  // 完成后返回
      {
        pageNumber: number,
        imageUrl?: string,
        audioUrl?: string
      }
    ],
    error?: string               // 失败时返回错误信息
  }
}
```

### 2.6 生成配音

**POST** `/api/create/voice`

> 为分镜生成配音（异步任务）

```typescript
// 请求
{
  storyboardId: string,
  voiceType: "default" | "cloned",
  voiceId?: string,              // 克隆声音ID（cloned模式必填）
  defaultVoice?: string          // 默认声音选择
}

// 响应
{
  success: true,
  data: {
    taskId: string,
    status: "processing",
    totalPages: number
  }
}
```

**默认声音选项**：
| 值 | 说明 |
|-----|------|
| female_gentle | 温柔女声 |
| female_lively | 活泼女声 |
| male_warm | 温暖男声 |
| child_cute | 可爱童声 |

### 2.7 克隆声音

**POST** `/api/create/voice-clone`

> 上传音频克隆用户声音

```typescript
// 请求（multipart/form-data）
{
  audioFile: File,               // 音频文件（10-30秒，支持 mp3/wav/m4a）
  name: string                   // 声音名称
}

// 响应
{
  success: true,
  data: {
    voiceId: string,
    name: string,
    duration: number,            // 音频时长（秒）
    status: "ready"
  }
}
```

### 2.8 合成电子绘本

**POST** `/api/create/compile`

> 将所有素材合成为最终的电子绘本

```typescript
// 请求
{
  storyboardId: string,
  title: string,
  coverImageId?: string          // 封面图片ID（可选，默认用第一页）
}

// 响应
{
  success: true,
  data: {
    workId: string,              // 作品ID
    title: string,
    pageCount: number,
    coverUrl: string,
    previewUrl: string           // 预览链接
  }
}
```

---

## 三、作品管理 API

### 3.1 获取我的作品列表

**GET** `/api/works`

```typescript
// 请求参数（Query）
{
  page?: number,                 // 页码，默认1
  pageSize?: number,             // 每页数量，默认10
  status?: "all" | "published" | "draft",  // 筛选状态
  sort?: "newest" | "oldest"     // 排序
}

// 响应
{
  success: true,
  data: {
    total: number,
    page: number,
    pageSize: number,
    works: [
      {
        workId: string,
        title: string,
        coverUrl: string,
        status: "draft" | "published",
        pageCount: number,
        createdAt: string,
        updatedAt: string,
        stats: {
          views: number,
          likes: number
        }
      }
    ]
  }
}
```

### 3.2 获取作品详情

**GET** `/api/works/:id`

```typescript
// 响应
{
  success: true,
  data: {
    workId: string,
    title: string,
    coverUrl: string,
    status: "draft" | "published",
    createdAt: string,
    updatedAt: string,
    pages: [
      {
        pageNumber: number,
        text: string,
        imageUrl: string,
        audioUrl: string
      }
    ],
    author: {
      userId: string,
      nickname: string,
      avatar: string
    },
    stats: {
      views: number,
      likes: number,
      shares: number
    }
  }
}
```

### 3.3 更新作品

**PUT** `/api/works/:id`

```typescript
// 请求
{
  title?: string,
  coverImageId?: string
}

// 响应
{
  success: true,
  data: {
    workId: string,
    title: string,
    coverUrl: string,
    updatedAt: string
  }
}
```

### 3.4 删除作品

**DELETE** `/api/works/:id`

```typescript
// 响应
{
  success: true,
  data: {
    message: "作品已删除"
  }
}
```

### 3.5 保存草稿

**POST** `/api/works/draft`

> 保存创作中的草稿（任意阶段）

```typescript
// 请求
{
  storyId?: string,
  storyboardId?: string,
  title?: string,
  currentStep: "story" | "storyboard" | "images" | "voice" | "compile"
}

// 响应
{
  success: true,
  data: {
    draftId: string,
    currentStep: string,
    savedAt: string
  }
}
```

### 3.6 获取草稿列表

**GET** `/api/works/drafts`

```typescript
// 响应
{
  success: true,
  data: {
    drafts: [
      {
        draftId: string,
        title: string,
        currentStep: string,
        coverUrl?: string,
        createdAt: string,
        updatedAt: string
      }
    ]
  }
}
```

---

## 四、模板系统 API

### 4.1 获取模板列表

**GET** `/api/templates`

```typescript
// 请求参数（Query）
{
  category?: string,             // 分类筛选
  search?: string,               // 搜索关键词
  page?: number,
  pageSize?: number
}

// 响应
{
  success: true,
  data: {
    total: number,
    templates: [
      {
        templateId: string,
        name: string,
        description: string,
        coverUrl: string,
        category: string,
        tags: string[],
        usageCount: number,      // 使用次数
        previewPages: number     // 预览页数
      }
    ]
  }
}
```

### 4.2 获取模板详情

**GET** `/api/templates/:id`

```typescript
// 响应
{
  success: true,
  data: {
    templateId: string,
    name: string,
    description: string,
    coverUrl: string,
    category: string,
    tags: string[],
    storyOutline: string,        // 故事大纲
    suggestedStyles: string[],   // 推荐画风
    requiredInputs: [            // 需要用户填写的内容
      {
        field: string,
        label: string,
        type: "text" | "select",
        options?: string[]
      }
    ],
    previewPages: [              // 预览页面
      {
        pageNumber: number,
        text: string,
        imageUrl: string
      }
    ]
  }
}
```

### 4.3 获取模板分类

**GET** `/api/templates/categories`

```typescript
// 响应
{
  success: true,
  data: {
    categories: [
      {
        id: string,
        name: string,
        icon: string,
        count: number            // 该分类模板数量
      }
    ]
  }
}
```

**预设分类**：
| ID | 名称 |
|-----|------|
| adventure | 冒险故事 |
| friendship | 友情故事 |
| family | 亲情故事 |
| nature | 自然探索 |
| education | 教育启蒙 |
| fantasy | 奇幻童话 |

---

## 五、社区发布 API

### 5.1 发布作品

**POST** `/api/works/:id/publish`

```typescript
// 请求
{
  visibility: "public" | "unlisted",  // 公开 / 仅链接可见
  allowComments: boolean
}

// 响应
{
  success: true,
  data: {
    workId: string,
    status: "published",
    visibility: string,
    shareUrl: string
  }
}
```

### 5.2 取消发布

**POST** `/api/works/:id/unpublish`

```typescript
// 响应
{
  success: true,
  data: {
    workId: string,
    status: "draft"
  }
}
```

### 5.3 获取作品广场

**GET** `/api/gallery`

```typescript
// 请求参数（Query）
{
  sort?: "hot" | "newest" | "featured",  // 最热/最新/精选
  search?: string,
  page?: number,
  pageSize?: number
}

// 响应
{
  success: true,
  data: {
    total: number,
    page: number,
    pageSize: number,
    works: [
      {
        workId: string,
        title: string,
        coverUrl: string,
        pageCount: number,
        author: {
          userId: string,
          nickname: string,
          avatar: string
        },
        stats: {
          views: number,
          likes: number
        },
        createdAt: string,
        isLiked: boolean         // 当前用户是否已点赞
      }
    ]
  }
}
```

### 5.4 点赞作品

**POST** `/api/gallery/:id/like`

```typescript
// 响应
{
  success: true,
  data: {
    workId: string,
    likes: number,               // 更新后的点赞数
    isLiked: true
  }
}
```

### 5.5 取消点赞

**DELETE** `/api/gallery/:id/like`

```typescript
// 响应
{
  success: true,
  data: {
    workId: string,
    likes: number,
    isLiked: false
  }
}
```

### 5.6 获取分享链接

**GET** `/api/works/:id/share`

```typescript
// 响应
{
  success: true,
  data: {
    shareUrl: string,            // 分享链接
    qrCodeUrl: string,           // 二维码图片
    embedCode: string            // 嵌入代码
  }
}
```

---

## 六、错误码定义

### 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `AUTH_REQUIRED` | 401 | 需要登录 |
| `AUTH_FAILED` | 401 | 认证失败（token 无效或过期） |
| `INVALID_PARAMS` | 400 | 参数错误 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `PERMISSION_DENIED` | 403 | 无权限操作 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `SERVER_ERROR` | 500 | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| `EMAIL_EXISTS` | 邮箱已被注册 |
| `EMAIL_NOT_FOUND` | 邮箱未注册 |
| `PASSWORD_WRONG` | 密码错误 |
| `STORY_NOT_FOUND` | 故事不存在 |
| `STORYBOARD_NOT_FOUND` | 分镜不存在 |
| `WORK_NOT_FOUND` | 作品不存在 |
| `TEMPLATE_NOT_FOUND` | 模板不存在 |
| `TASK_NOT_FOUND` | 任务不存在 |
| `TASK_FAILED` | 任务执行失败 |
| `TASK_TIMEOUT` | 任务超时 |
| `AI_SERVICE_ERROR` | AI 服务异常 |
| `VOICE_CLONE_FAILED` | 声音克隆失败 |
| `FILE_TOO_LARGE` | 文件过大 |
| `INVALID_FILE_TYPE` | 文件类型不支持 |
| `QUOTA_EXCEEDED` | 配额已用完 |

---

## 附录

### A. 数据模型关系

```
User (用户)
  ├── Work (作品) [1:N]
  │     ├── Story (故事) [1:1]
  │     ├── Storyboard (分镜) [1:1]
  │     │     └── Page (页面) [1:N]
  │     │           ├── Image (图片) [1:1]
  │     │           └── Audio (音频) [1:1]
  │     └── Like (点赞) [N:M]
  └── ClonedVoice (克隆声音) [1:N]

Template (模板)
  └── PreviewPage (预览页) [1:N]
```

### B. 文件存储

| 类型 | 格式 | 最大大小 | 存储位置 |
|------|------|----------|----------|
| 图片 | PNG/JPG | 5MB | Vercel Blob / Cloudflare R2 |
| 音频 | MP3 | 10MB | Vercel Blob / Cloudflare R2 |
| 克隆音频 | MP3/WAV/M4A | 20MB | 临时存储 |

### C. 第三方服务依赖

| 功能 | 服务商 | 备选方案 |
|------|--------|----------|
| 故事生成 | Claude API | OpenAI GPT-4 |
| 图片生成 | Midjourney API | DALL-E 3 / Stable Diffusion |
| 语音合成 | Azure TTS | Google TTS |
| 声音克隆 | ElevenLabs | 讯飞语音 |

---

*文档创建: 2026-01-09*
