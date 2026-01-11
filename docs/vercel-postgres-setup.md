# Vercel Postgres 数据库创建指南

本指南将帮助你在 Vercel 平台上创建 Postgres 数据库，并完成项目配置。

## 什么是 Vercel Postgres？

**Vercel Postgres** 是 Vercel 提供的托管 Postgres 数据库服务，底层使用 **Neon**（一个 serverless Postgres 提供商）。

### 与 Prisma 的区别

- **Vercel Postgres**：数据库服务（存储数据的地方）
- **Prisma**：ORM 工具（操作数据库的方式）
- **@vercel/postgres**：Vercel 提供的 Postgres 客户端库（我们项目使用的）

**我们的项目使用**：
- 数据库：Vercel Postgres（Neon）
- 客户端：`@vercel/postgres` 包（不是 Prisma）
- 查询方式：SQL 模板字符串（不是 Prisma ORM）

---

## 第一步：在 Vercel 控制台创建数据库

### 1. 登录 Vercel 控制台
访问：https://vercel.com/dashboard

### 2. 进入项目页面
- 点击你的项目：**storybook-gamma-ten**
- 进入项目详情页

### 3. 进入 Storage 页面
- 点击顶部导航栏的 **Storage** 标签
- 点击 **Create New** 按钮（或 **Browse Storage**）

### 4. 选择 Neon Postgres
**重要**：Vercel 现在通过 Marketplace 提供 Postgres 服务

在 **Marketplace Database Providers** 部分：
- 点击 **Neon** 选项
- 描述：Serverless Postgres

### 5. 配置数据库
- 选择区域（Region）：建议选择 **Singapore** 或 **Hong Kong**（离中国大陆最近）
- 数据库名称会自动生成
- 点击 **Create** 或 **Continue** 按钮

### 6. 连接到项目
- Neon 会自动连接到你的当前项目
- 自动添加环境变量到所有环境（Production, Preview, Development）
- 等待 1-2 分钟完成配置

---

## 第二步：验证数据库连接

### 1. 检查环境变量
创建完成后，进入项目设置验证：
- 点击项目顶部的 **Settings** 标签
- 点击左侧的 **Environment Variables**
- 确认已自动添加以下变量：
  - `POSTGRES_URL`
  - `POSTGRES_PRISMA_URL`
  - `POSTGRES_URL_NON_POOLING`
  - `POSTGRES_USER`
  - `POSTGRES_HOST`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DATABASE`

**注意**：这些变量由 Neon 自动添加，无需手动配置。

---

## 第三步：配置其他环境变量

### 1. 进入项目设置
- 在项目页面，点击顶部的 **Settings** 标签
- 点击左侧的 **Environment Variables**

### 2. 添加必需的环境变量

#### JWT 密钥（必需）
- **Key**: `JWT_SECRET`
- **Value**: 生成一个随机字符串（至少 32 位）
- **Environments**: Production, Preview, Development（全选）

**生成方法**：
```bash
# 方法1：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2：使用在线工具
# 访问：https://www.random.org/strings/
# 生成 1 个长度为 64 的随机字符串
```

#### 数据库初始化密钥（可选）
- **Key**: `DB_INIT_SECRET`
- **Value**: 自定义密钥（用于保护数据库初始化接口）
- **Environments**: Production, Preview, Development（全选）

**示例**：`my-secret-init-key-2026`

---

## 第四步：重新部署项目

### 1. 触发重新部署
添加环境变量后，需要重新部署项目以使其生效：

**方法1：通过 Git 推送**
```bash
# 在本地项目目录执行
git commit --allow-empty -m "触发重新部署"
git push
```

**方法2：通过 Vercel 控制台**
- 在项目页面，点击 **Deployments** 标签
- 点击最新部署右侧的 **...** 菜单
- 选择 **Redeploy**
- 点击 **Redeploy** 按钮确认

### 2. 等待部署完成
- 部署通常需要 1-2 分钟
- 部署完成后，环境变量会生效

---

## 第五步：初始化数据库表

### 1. 调用初始化接口
使用 API 工具（如 Postman、curl、或浏览器）调用初始化接口：

**接口地址**：
```
POST https://storybook-gamma-ten.vercel.app/api/db/init
```

**请求头**：
```
Content-Type: application/json
```

**请求体**：
```json
{
  "secret": "你的DB_INIT_SECRET值"
}
```

**使用 curl 命令**：
```bash
curl -X POST https://storybook-gamma-ten.vercel.app/api/db/init \
  -H "Content-Type: application/json" \
  -d '{"secret":"你的DB_INIT_SECRET值"}'
```

**使用 PowerShell**：
```powershell
$body = @{
    secret = "你的DB_INIT_SECRET值"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://storybook-gamma-ten.vercel.app/api/db/init" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### 2. 验证初始化结果
如果成功，会返回：
```json
{
  "success": true,
  "data": {
    "message": "数据库初始化成功"
  }
}
```

---

## 第六步：验证数据库连接

### 1. 在 Vercel 控制台查看数据库
- 进入 **Storage** → 选择你��数据库
- 点击 **Data** 标签
- 点击 **Browse Data** 按钮
- 你应该能看到 8 张表：
  - `users` - 用户表
  - `works` - 作品表
  - `stories` - 故事表
  - `storyboards` - 分镜表
  - `storyboard_pages` - 分镜页面表
  - `cloned_voices` - 克隆声音表
  - `likes` - 点赞表
  - `templates` - 模板表
  - `tasks` - 异步任务表

### 2. 测试用户注册
访问你的网站，尝试注册一个新用户：
```
https://storybook-gamma-ten.vercel.app/login
```

如果注册成功，说明数据库连接正常。

---

## 数据库 Schema 说明

项目已定义 8 张表，结构如下：

### 1. users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| email | VARCHAR(255) | 邮箱（唯一） |
| password_hash | VARCHAR(255) | 密码哈希 |
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(500) | 头像 URL |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. works（作品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| user_id | VARCHAR(36) | 用户 ID（外键） |
| title | VARCHAR(200) | 作品标题 |
| cover_url | VARCHAR(500) | 封面 URL |
| status | VARCHAR(20) | 状态（draft/completed） |
| visibility | VARCHAR(20) | 可见性（private/public） |
| page_count | INTEGER | 页数 |
| views | INTEGER | 浏览量 |
| likes | INTEGER | 点赞数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3. stories（故事表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| work_id | VARCHAR(36) | 作品 ID（外键） |
| content | TEXT | 故事内容 |
| word_count | INTEGER | 字数 |
| created_at | TIMESTAMP | 创建时间 |

### 4. storyboards（分镜表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| work_id | VARCHAR(36) | 作品 ID（外键） |
| story_id | VARCHAR(36) | 故事 ID（外键） |
| created_at | TIMESTAMP | 创建时间 |

### 5. storyboard_pages（分镜页面表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| storyboard_id | VARCHAR(36) | 分镜 ID（外键） |
| page_number | INTEGER | 页码 |
| text | TEXT | 页面文本 |
| image_prompt | TEXT | 图片提示词 |
| image_url | VARCHAR(500) | 图片 URL |
| audio_url | VARCHAR(500) | 音频 URL |
| duration | INTEGER | 音频时长（秒） |
| created_at | TIMESTAMP | 创建时间 |

### 6. cloned_voices（克隆声音表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| user_id | VARCHAR(36) | 用户 ID（外键） |
| name | VARCHAR(100) | 声音名称 |
| voice_id | VARCHAR(100) | 声音 ID |
| duration | INTEGER | 音频时长（秒） |
| status | VARCHAR(20) | 状态（processing/completed） |
| created_at | TIMESTAMP | 创建时间 |

### 7. likes（点赞表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| user_id | VARCHAR(36) | 用户 ID（外键） |
| work_id | VARCHAR(36) | 作品 ID（外键） |
| created_at | TIMESTAMP | 创建时间 |
| UNIQUE(user_id, work_id) | - | 唯一约束 |

### 8. templates（模板表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| name | VARCHAR(200) | 模板名称 |
| description | TEXT | 描述 |
| cover_url | VARCHAR(500) | 封面 URL |
| category | VARCHAR(50) | 分类 |
| tags | TEXT[] | 标签数组 |
| story_outline | TEXT | 故事大纲 |
| suggested_styles | TEXT[] | 建议风格数组 |
| usage_count | INTEGER | 使用次数 |
| created_at | TIMESTAMP | 创建时间 |

### 9. tasks（异步任务表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | 主键 |
| user_id | VARCHAR(36) | 用户 ID（外键） |
| type | VARCHAR(50) | 任务类型 |
| status | VARCHAR(20) | 状态（processing/completed/failed） |
| progress | INTEGER | 进度（0-100） |
| total_items | INTEGER | 总项目数 |
| completed_items | INTEGER | 已完成项目数 |
| result | JSONB | 结果（JSON） |
| error | TEXT | 错误信息 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

## 常见问题

### Q1: 数据库创建失败怎么办？
**A**: 检查以下几点：
- Vercel 账户是否已验证邮箱
- 是否超出免费计划限制（Hobby 计划只能创建 1 个数据库）
- 尝试切换不同的区域（Region）

### Q2: 环境变量配置后不生效？
**A**: 需要重新部署项目才能使环境变量生效。

### Q3: 初始化接口返回 403 错误？
**A**: 检查 `DB_INIT_SECRET` 是否配置正确，请求体中的 `secret` 值是否匹配。

### Q4: 初始化接口返回 500 错误？
**A**: 可能是数据库连接失败，检查：
- 数据库是否已连接到项目
- 环境变量是否已配置
- 项目是否已重新部署

### Q5: 如何查看数据库日志？
**A**: 在 Vercel 控制台：
- 进入项目页面
- 点击 **Deployments** 标签
- 点击最新部署
- 点击 **Functions** 标签
- 选择 `/api` 函数查看日志

---

## 下一步

数据库创建完成后，你可以：
1. 配置 AI 服务的 API 密钥（OpenAI、Claude 等）
2. 测试完整的创作流程
3. 添加初始模板数据
4. 配置图片存储服务（如 Cloudinary、七牛云等）

---

*创建时间: 2026-01-11*
