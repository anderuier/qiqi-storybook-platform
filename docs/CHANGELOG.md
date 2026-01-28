# 柒柒の魔法绘本屋 - 项目更新日志 (CHANGELOG)

记录项目每次更新的内容，按时间倒序排列。

---

## [2026-01-28] 性能优化：模型升级与用户体验提升

### 本次更新摘要
通过切换到 GLM-4.7-FlashX 高速模型、关闭思考模式，实现 3-6 倍速度提升。新增宝贝性别选择和自定义页数功能，优化创作流程体验。

### 详细内容

#### 1. 性能优化：模型升级与思考模式关闭

**问题背景**：
- AI 分镜生成速度慢，用户体验不佳
- 普通模型响应时间长，影响创作流程

**优化方案**：

| 优化项 | 说明 | 速度提升 |
|--------|------|----------|
| 模型切换 | GLM-4 → GLM-4.7-FlashX | 3-6 倍 |
| thinking 模式 | 关闭思考模式 | 减少响应时间 |
| reasoning_mode | 关闭推理模式 | 减少响应时间 |

**修改文件**：`api/index.ts`

**相关提交**：
- `ac9679d` - 分镜生成使用 glm-4-flashx 模型避免超时
- `abf22c5` - 使用 GLM-4.7-FlashX 模型
- `4ea56bf` - 关闭 reasoning_mode 模式加快分镜生成
- `4881cf0` - 设置 thinking: {type: 'disabled'} 关闭思考模式
- `8281790` - 生成故事也关闭 thinking 模式加快速度

#### 2. 新增功能：宝贝性别选择

**功能内容**：
- 添加男孩/女孩按钮选择，带视觉反馈
- 默认值设为男孩
- 在 Prompt 中体现宝贝的年龄和性别

**修改文件**：
- `client/src/components/create/InputStep.tsx`
- `client/src/components/create/constants.ts`
- `client/src/hooks/useCreate.ts`
- `api/index.ts`
- `api/prompts.config.ts`

**相关提交**：`d61a76a`

#### 3. 新增功能：用户自定义绘本页数

**功能内容**：
- 页数输入范围：4-12页（初版为 6-12 页）
- 输入超出范围显示错误提示
- 默认值：6页

**修改文件**：
- `client/src/components/create/StoryStep.tsx`
- `client/src/hooks/useCreate.ts`

**相关提交**：
- `158cac8` - 用户自定义绘本页数(6-12页)
- `6d74487` - 页数范围从 6-12 改为 4-12

#### 4. 优化创作页面布局

**优化内容**：
- 移除故事长度选择，简化创作流程
- 宝贝信息区域添加渐变背景和图标
- 名字、年龄、性别改为 3 列布局
- 故事风格改为按钮样式，更直观

**相关提交**：`d61a76a`

#### 5. 调试增强

**新增内容**：
- 添加完整 Prompt 日志用于手动测试
- 添加分镜生成开始/结束时间记录
- 记录 AI API 调用耗时
- 记录数据库操作耗时

**相关提交**：
- `6057c43` - 添加完整 Prompt 日志
- `158cac8` - 添加分镜生成详细日志

### Git 提交记录

| Commit | 说明 |
|--------|------|
| 8281790 | 修复：生成故事也关闭 thinking 模式加快速度 |
| d61a76a | 功能：添加宝贝性别选项，优化创作页面布局 |
| 6d74487 | 修改：页数范围从 6-12 改为 4-12 |
| 4881cf0 | 修复：设置 thinking: {type: 'disabled'} 关闭思考模式 |
| 4ea56bf | 修复：关闭 reasoning_mode 模式以加快分镜生成速度 |
| 6057c43 | 调试：添加完整 Prompt 日志用于手动测试 |
| abf22c5 | 修复：使用 GLM-4.7-FlashX 模型 |
| ac9679d | 修复：分镜生成使用 glm-4-flashx 模型避免超时 |
| 158cac8 | 功能：用户自定义绘本页数(6-12页)，添加分镜生成详细日志 |

### 当前项目状态

| 模块 | 状态 |
|------|------|
| 用户认证 | ✅ 完成 |
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成（已优化） |
| AI 图片生成 | ✅ 完成 |
| 图片永久存储 | ✅ 完成 |
| 草稿保存/恢复 | ✅ 完成 |
| 绘本预览/播放 | ✅ 完成 |
| 性能优化 | ✅ 完成 |
| 语音生成 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |

### 下一步计划

1. **语音生成功能** - 添加 TTS 服务
2. **作品发布功能** - 社区分享
3. **作品下载功能** - PDF/视频导出

---

## [2026-01-27] 草稿恢复修复与分镜生成优化

### 本次更新摘要
修复草稿恢复时图片丢失的问题，优化分镜生成的解析能力和错误处理，增强系统稳定性。

### 详细内容

#### 1. 修复草稿恢复时图片丢失问题

**问题现象**：
- 生成图片后，点击下一步绘本可以正常查看
- 退出草稿后再进入，图片都没有了，显示默认图片
- 页数不对（6页变4页）
- 我的作品界面点击播放按钮，提示"无法加载绘本"

**根本原因**：
用户重新生成分镜时，系统会创建新的 `storyboard` 记录，但不会删除旧的记录。查询草稿详情时使用 `LIMIT 1` 但没有 `ORDER BY created_at DESC`，导致可能返回旧的 storyboard 记录。

**修复方案**：

| 接口 | 修改内容 |
|------|----------|
| 草稿详情 `/api/drafts/:id` | 添加 `ORDER BY created_at DESC` |
| 作品详情 `/api/works/:id` | 添加 `ORDER BY created_at DESC` |
| 草稿列表 `/api/works` | 添加 `ORDER BY sb.created_at DESC` |

**Commit**: `7c028c9`

#### 2. 优化分镜生成的解析能力

**问题现象**：
- 分镜生成时经常报"分镜数据解析失败，请重试"
- 有时生成的分镜内容不完整
- Vercel 部署时报错

**修复方案**：

| 修改项 | 修改前 | 修改后 |
|--------|--------|--------|
| max_tokens | 2048 | 4000 |
| 正则表达式位置 | 函数内部 | 模块作用域（性能优化） |
| 正则表达式语法 | 使用 `/s` 标志 | 使用 `[\s\S]` 兼容写法 |
| 分隔符匹配 | 只匹配 `---第X页---` | 支持多种变体格式 |

**支持的分镜格式变体**：
- 分隔符：`---第1页---`、`===第1页===`、`【第1页】`、`第1页：`
- 文字标签：`文字：`、`故事文字：`
- 画面标签：`画面：`、`画面描述：`、`场景：`、`图片：`

**Commit**: `b887062`

#### 3. 增强错误处理

**新增功能**：
- 添加详细的日志记录（AI 返回内容长度、解析结果页数）
- 区分不同错误类型（超时、认证、限流等）
- 返回更友好的错误信息

**错误类型**：

| 错误码 | 说明 |
|--------|------|
| `RATE_LIMIT` | AI 服务请求过于频繁 |
| `AUTH_ERROR` | AI 服务认证失败 |
| `TIMEOUT` | AI 服务连接超时 |
| `PARSE_ERROR` | 分镜数据解析失败 |
| `AI_ERROR` | AI 服务暂时不可用 |

### Git 提交记录

| Commit | 说明 |
|--------|------|
| b887062 | 优化：增强分镜生成的解析能力和错误处理 |
| 7c028c9 | 修复：草稿恢复时获取最新的分镜记录 |

### 当前项目状态

| 模块 | 状态 |
|------|------|
| 用户认证 | ✅ 完成 |
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成（已优化） |
| AI 图片生成 | ✅ 完成 |
| 图片永久存储 | ✅ 完成 |
| 草稿保存/恢复 | ✅ 完成（已修复） |
| 绘本预览/播放 | ✅ 完成 |
| 语音生成 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |

### 下一步计划

1. **语音生成功能** - 添加 TTS 服务
2. **作品发布功能** - 社区分享
3. **作品下载功能** - PDF/视频导出

---

## [2026-01-24] 绘本预览、播放和全屏功能完整实现 

### 本次更新摘要
完成绘本预览、播放和全屏功能的完整实现，创作流程从 5 步扩展到 6 步，添加独立的绘本播放页面，���现全屏沉浸式体验，修复用户头像显示问题。

### 详细内容

#### 1. 创作流程优化（步骤扩展）

**改动**：将创作流程从 5 步扩展到 6 步

| 步骤 | 名称 | 说明 |
|------|------|------|
| 1 | 输入 | 选择模式、输入内容 |
| 2 | 故事 | AI 生成故事 |
| 3 | 分镜 | AI 生成分镜脚本 |
| 4 | 图片 | AI 生成图片 |
| 5 | **绘本** | **新增：预览翻页效果** |
| 6 | **配音** | **新增：选择配音（可选）** |

**关键设计决策**：
- 绘本生成步骤不生成新文件，只是数据的展示方式
- 配音步骤可选，添加"无配音"选项

**Commit**: `13a1068`

#### 2. BookStep 组件开发

**功能**：独立的绘本预览组件，复用 DemoSection 的翻页动画

**核心特性**：
- 响应式布局：桌面端左图右文（2:1），移动端上图下文（500px）
- 翻页动画：桌面端 3D 翻页，移动端渐变切换
- 交互控制：键盘方向键、自动播放（4秒）、翻页按钮

**技术实现**：
- 使用 Framer Motion 实现动画
- 使用 useMemo 缓存页面数据
- 使用 useCallback 优化回调函数

**文件**：`client/src/components/create/BookStep.tsx` (452 行)

#### 3. VoiceStep 组件优化

**新增功能**：
- 添加"无配音"选项（VolumeX 图标，绿色主题）
- 标题添加"(可选)"提示
- 配音选项合并显示

**UI 优化**：
- 无配音选项：绿色（mint）主题
- 其他选项：珊瑚色（coral）主题

#### 4. 绘本播放功能

**新增页面**：`BookPreview.tsx`

**路由**：`/book/:workId`

**功能**：
- 从草稿 API 加载绘本数据
- 检查是否有图片，无图片显示错误提示
- 复用 BookStep 组件展示绘本内容
- 添加返回按钮

**我的作品页面优化**：
- 播放按钮点击跳转到绘本预览页面
- 检查是否有图片，无图片弹出提示
- 移动端显示播放按钮（之前不显示）

**Commit**: `823829c`

#### 5. 移动端图片显示优化

**优化内容**：
- 竖屏模式图片区域添加圆角（`rounded-t-2xl`）
- 文字区域添加圆角（`rounded-b-2xl`）
- 图片改为 `object-cover` 填满容器
- 移除图片 padding，直接贴边显示

**Commit**: `8ff9859`

#### 6. 全屏播放功能

**实现**：
- 使用 Fullscreen API（`requestFullscreen` / `exitFullscreen`）
- 监听 `fullscreenchange` 事件
- 添加全屏按钮（Maximize / Minimize 图标）

**全屏模式布局优化**：

| 模式 | 布局 |
|------|------|
| 桌面端/横屏 | 控制条悬浮在右侧文字区域底部 |
| 移动端竖屏 | 控制条在底部正常显示 |

**图片显示优化**：
- 全屏模式：`object-cover` 填满容器
- 非全屏模式：`object-contain` 保持完整
- 翻页动画层图片同步优化

**Commit**: `83a6579`

#### 7. 用户头像显示问题修复

**问题**：登录后用户的默认头像不能正常显示

**原因**：
- 文件从 `avatar-default.png` 改为 `avatar-default.webp`
- 代码中的引用都已更新
- 但数据库中已有用户的 avatar 字段存储的是旧路径

**解决方案**：
1. 创建临时 API 端点 `/api/fix/avatar`
2. 执行 SQL 更新所有旧路径
3. 用户在浏览器控制台执行修复
4. 删除临时端点确保安全

**SQL 更新**：
```sql
UPDATE users
SET avatar = '/images/avatar-default.webp'
WHERE avatar IS NULL OR avatar = '' OR avatar = '/images/avatar-default.png'
```

**Commits**: `d27b8b3` (添加), `e56e999` (删除)

### 技术亮点

#### 1. 响应式设计
- 桌面端、移动端横屏、移动端竖屏三种布局
- 自动检测屏幕方向和尺寸
- 控制条和交互元素自适应

#### 2. 性能优化
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存回调函数
- 图片懒加载（`loading="lazy"`）

#### 3. 用户体验
- 翻页动画流畅（3D 翻页 + 渐变切换）
- 键盘快捷键支持
- 自动播放功能
- 全屏沉浸式体验
- 移动端友好的触控交互

### 文件变更统计

**新增文件**：
- `client/src/components/create/BookStep.tsx` (452 行)
- `client/src/pages/BookPreview.tsx` (150 行)

**修改文件**：
- `client/src/components/create/constants.ts`
- `client/src/components/create/index.ts`
- `client/src/components/create/VoiceStep.tsx`
- `client/src/pages/Create.tsx`
- `client/src/pages/MyWorks.tsx`
- `client/src/App.tsx`
- `api/index.ts`

**代码统计**：
- 新增代码：约 600+ 行
- 修改代码：约 200+ 行
- 删除代码：约 50+ 行

### Git 提交记录

| Commit | 说明 |
|--------|------|
| 13a1068 | 功能：添加绘本预览和配音步骤 |
| 823829c | 功能：添加绘本播放功能 |
| 8ff9859 | 优化：移动端绘本图片显示效果 |
| 83a6579 | 功能：添加全屏播放功能并优化显示效果 |
| d27b8b3 | 修复：添加临时端点更新用户头像路径 |
| e56e999 | 清理：移除临时头像修复端点 |

---

## [2026-01-24] UI/UX 优化与技术规范总结

### 本次更新摘要
完成多个 UI/UX 问题修复，实现图片生成轮询的指数退避算法，创建现代网站开发技术指南文档。

### 详细内容

#### 1. Avatar 默认图片显示修复

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 用户头像默认图不显示 | 空字符串 `""` 不被 `\|\|` 处理 | 使用 `.trim()` 处理空字符串 |

**修改文件**：
- `client/src/components/Header.tsx`
- `client/src/pages/AccountSettings.tsx`
- `api/index.ts`

#### 2. Draft Card 播放按钮可见性修复

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 悬停时播放按钮不显示 | z-index 层级冲突 | 按钮容器提升到 z-30，添加 pointer-events 控制 |

**Commit**: `ba1d940`

#### 3. 图片生成轮询优化

**优化方案**：实现自适应指数退避算法

| 参数 | 值 | 说明 |
|------|-----|------|
| initialDelay | 1000ms | 初始延迟 |
| minDelay | 1000ms | 最小延迟 |
| maxDelay | 10000ms | 最大延迟 |
| backoffFactor | 1.5 | 失败后延迟倍数 |
| successFactor | 0.8 | 成功后延迟倍数 |

**收益**：
- 成功时加速响应（1s → 0.8s → 1s ...）
- 失败时减轻服务器压力（1s → 1.5s → 2.25s ...）

**Commit**: `7dff4b3`

#### 4. 图片操作按钮修复

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 按钮不显示 | CSS 类顺序 `md:flex hidden` 错误 | 改为 `hidden md:flex` |
| 按钮被遮挡 | 容器无 z-index | 添加 z-20 |

**Commits**: `47cac40`, `4944080`

#### 5. 移动端按钮布局优化

**问题**：移动端竖屏图片小（1.5cm × 1.5cm），按钮溢出

**解决方案**：
- 点击展开显示操作层
- 顶部：关闭按钮
- 中间：两个操作按钮水平排列
- 底部：占位保持布局

**Commit**: `e98f825`

#### 6. 重新生成加载状态

**技术方案**：URL 变化检测判断操作完成

```tsx
// 记录旧 URL → 监听 pageImages 变化 → 检测到 URL 变化 → 移除加载状态
```

**Commit**: `896d01a`

#### 7. 创建技术规范文档

**文件**：`docs/web-development-best-practices.md`

**内容章节**：
- React 性能优化
- CSS 与样式规范
- 异步操作与状态管理
- 响应式设计
- 图片与资源优化
- 安全实践
- 代码组织与维护性
- 检查清单

#### 8. 更新 CLAUDE.md

**新增条款**：
```markdown
### 性能与安全规范
- 开发时遵循 `docs/web-development-best-practices.md` 的技术规范
```

**Commit**: `08aa7aa`

### 提交记录

| Commit ID | 说明 |
|-----------|------|
| 08aa7aa | 文档：更新 CLAUDE.md，添加技术规范引用 |
| 896d01a | 优化：图片重新生成添加加载提示，优化移动端按钮布局 |
| e98f825 | 修复：移动端竖屏按钮水平排列，确保三个按钮都在图片范围内 |
| 934ea43 | 优化：移动端图片按钮改为点击显示，添加关闭按钮 |
| 7dff4b3 | 优化：图片生成轮询使用指数退避算法 |
| 4944080 | 修复：图片操作按钮 z-index 层级问题 |
| 47cac40 | 修复：图片操作按钮 CSS 类顺序问题 |
| ba1d940 | 修复：草稿卡片播放按钮 z-index 层级问题 |

### 当前项目状态

| 模块 | 状态 |
|------|------|
| 前端 UI | ✅ 完成 |
| React 性能优化 | ✅ 完成 |
| 指数退避轮询 | ✅ 完成 |
| 响应式交互 | ✅ 完成 |
| 用户认证 | ✅ 完成 |
| AI 故事/分镜/图片生成 | ✅ 完成 |
| 图片永久存储 | ✅ 完成 |
| 绘本预览/播放 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |
| 语音朗读 | ⏳ 待开发 |

### 下一步计划

**功能开发**：
- 绘本预览/播放功能
- 作品发布功能
- 语音朗读功能

**可选优化**：
- useCallback/useMemo 优化其他组件（按需）
- Bundle 分析工具集成

---

## [2026-01-23] 性能优化：useMemo/useCallback 与 WebP 图片迁移

### 本次更新摘要
完成 DemoSection 组件的性能优化（useMemo/useCallback），将所有图片从 PNG 格式迁移到 WebP 格式。图片体积减少约 70-95%，大幅提升加载速度。

### 详细内容

#### 1. useMemo/useCallback 优化

**目标文件**: `client/src/components/DemoSection.tsx`

| 项目 | 优化方式 | 收益 |
|------|----------|------|
| `pages` 数组 | `useMemo` 缓存 | 只创建一次，节省内存 |
| `handleNext` 函数 | `useCallback` 缓存 | 函数引用稳定 |
| `handlePrev` 函数 | `useCallback` 缓存 | 函数引用稳定 |
| `handleKeyDown` 函数 | `useCallback` 缓存 | 函数引用稳定 |
| 键盘事件 useEffect | 优化依赖项 | 减少事件监听器解绑/重绑 |

**Commit**: `4cc48cf`

#### 2. 图片格式迁移（PNG → WebP）

**迁移规模**:
- 删除 PNG 文件：34 个
- 添加 WebP 文件：34 个
- 修改代码文件：13 个

**文件体积对比**:
| 文件类型 | PNG 大小 | WebP 大小 | 收益 |
|---------|---------|----------|------|
| 单张图片 | 5-8 MB | 80-500 KB | 减少 70-95% |
| 总体（估算） | ~200 MB | ~10 MB | 减少 ~95% |

**修改的代码文件**:
- `AboutSection.tsx` - about-story.webp
- `Home.tsx` - hero-illustration.webp, feature-*.webp
- `Gallery.tsx` - demo-book.webp, default-avatar.webp
- `Login.tsx` - hero-illustration.webp
- `Templates.tsx` - demo-book.webp
- `MyWorks.tsx` - draft-default.webp
- `DemoSection.tsx` - demo-page-1~7.webp
- `constants.ts` - demo-book.webp
- `ImagesStep.tsx` - image-placeholder.webp
- `Header.tsx` - avatar-default.webp
- `GallerySection.tsx` - avatar-1~6.webp, work-1~6.webp
- `TemplateSection.tsx` - template-*.webp
- `ProfileTab.tsx` - avatar-default.webp

**Commit**: `36c4c1c`

### 当前项目状态

| 模块 | 状态 |
|------|------|
| 前端 UI | ✅ 完成 |
| 路由懒加载 | ✅ 完成 |
| 组件拆分 | ✅ 完成 |
| React.memo 优化 | ✅ 完成 |
| 图片懒加载 | ✅ 完成 |
| useMemo/useCallback | ✅ 完成 |
| WebP 图片格式 | ✅ 完成 |
| 用户认证 | ✅ 完成 |
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成 |
| AI 图片生成 | ✅ 完成 |
| 图片永久存储 | ✅ 完成（Vercel Blob） |
| 草稿保存/恢复 | ✅ 完成 |
| 绘本预览/播放 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |
| 语音朗读 | ⏳ 待开发 |

### 下一步计划

**性能优化**:
- Polling exponential backoff in useCreate.ts
- 检查 lucide-react import pattern（确保 tree-shaking）
- useCallback 优化其他组件
- useMemo 优化其他组件
- Bundle 分析工具集成

**功能开发**:
- 开发绘本预览/播放功能
- 实现作品发布功能
- 集成语音朗读功能

---

## [2026-01-22] 局域网开发配置与草稿列表图片预览

### 本次更新摘要
完成开发环境局域网访问配置，解决手机端无法访问本地开发服务器的问题。实现草稿列表图片预览功能，已生成图片的草稿显示第一张分镜图，未生成的显示默认占位图。

### 详细内容

#### 1. 局域网开发访问配置

**问题**：本地 `pnpm dev` 启动后，手机端无法通过局域网 IP 访问开发服务器。

**原因**：
1. Vite 配置中 `allowedHosts` 只允许特定域名
2. Windows 防火墙阻止了 Node.js 的入站连接

**解决方案**：

1. **修改 `vite.config.ts`**：
   ```typescript
   server: {
     port: 3000,
     host: "0.0.0.0", // 监听所有网络接口
     allowedHosts: "all", // 允许所有主机访问
   }
   ```

2. **添加防火墙规则**：
   ```powershell
   New-NetFirewallRule -DisplayName 'Node.js Development Server' `
     -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

**文件修改**：`vite.config.ts`

#### 2. 草稿列表图片预览功能

**需求**：
- 已生成分镜图片的草稿 → 显示第一张分镜图
- 未生成图片的草稿 → 显示默认占位图

**技术实现**：

使用 `LEFT JOIN LATERAL` 子查询在主查询中获取第一张分镜图片：

```sql
SELECT
  w.*, sp.image_url as first_image_url
FROM works w
LEFT JOIN LATERAL (
  SELECT sp.image_url, sb.work_id
  FROM storyboard_pages sp
  JOIN storyboards sb ON sp.storyboard_id = sb.id
  WHERE sb.work_id = w.id AND sp.image_url IS NOT NULL
  ORDER BY sp.page_number ASC
  LIMIT 1
) sp ON true
WHERE w.user_id = ${userId}
```

**文件修改**：
- `api/index.ts` - 后端返回 `firstImageUrl` 字段
- `client/src/lib/api.ts` - Work 接口添加 `firstImageUrl`
- `client/src/pages/MyWorks.tsx` - 显示逻辑：`firstImageUrl || coverUrl || "/images/draft-default.png"`
- `client/public/images/draft-default.png` - 新增默认占位图

#### 3. Vercel 部署问题修复

| 尝试 | 问题 | 原因 |
|------|------|------|
| 第1次 | `sql(workIds)` 语法错误 | Vercel Postgres 不支持 |
| 第2次 | `sql.query` 不存在 | `sql` 是模板标签函数 |
| 第3次 | `sql.unsafe` 不存在 | `sql` 对象无此方法 |
| **最终** | ✅ `LEFT JOIN LATERAL` 子查询 | 直接在主查询中获取 |

### 提交记录

| Commit ID | 说明 |
|-----------|------|
| 3ea7f98 | 修复：使用 LEFT JOIN LATERAL 获取第一张分镜图片 |
| 1e86761 | 修复：使用 sql.unsafe 方法构建 IN 查询（第3次尝试） |
| 991329a | 修复：Vercel 部署时 SQL 查询语法错误（第2次尝试） |
| 6d42381 | 新增：草稿列表显示分镜图片预览 |
| eec6845 | 优化：首页在线演示书页翻页效果 |

---

## [2026-01-22] 首页在线演示书页翻页效果（早间更新）

### 本次更新摘要
完成首页在线演示组件的重构，实现真实的书页翻页动画效果。配置本地开发环境直接请求 Vercel API，添加用户默认头像。

### 详细内容

#### 1. 首页在线演示组件重构

**设计目标**：
- 左半边显示 1:1 尺寸的绘本图片
- 右半边显示绘本文字内容
- 翻页轴心在书本中线（图片和文字分界线）
- 模拟真实书页翻页动画

**技术实现**：

使用 CSS 3D 变换和 Framer Motion 实现翻页效果：

```typescript
// 向后翻页（下一页）
<motion.div
  style={{ transformOrigin: "left center" }}
  initial={{ rotateY: 0 }}
  animate={{ rotateY: -180 }}
>
  {/* 正面：当前页文字 */}
  <div style={{ backfaceVisibility: "hidden" }}>...</div>
  {/* 背面：下一页图片 */}
  <div style={{ transform: "rotateY(180deg)" }}>...</div>
</motion.div>

// 向前翻页（上一页）
<motion.div
  style={{ transformOrigin: "right center" }}
  initial={{ rotateY: 0 }}
  animate={{ rotateY: 180 }}
>
  {/* 正面：当前页图片 */}
  <div style={{ backfaceVisibility: "hidden" }}>...</div>
  {/* 背面：上一页文字 */}
  <div style={{ transform: "rotateY(-180deg)" }}>...</div>
</motion.div>
```

**新增功能**：
- 键盘方向键翻页支持（← →）
- 自动播放功能（4秒间隔）
- 翻页阴影动画效果
- 可爱的渐变文字样式

**文件修改**：`client/src/components/DemoSection.tsx`

#### 2. 本地开发环境配置

**问题**：本地 `pnpm dev` 启动后，登录、保存草稿等功能无法使用

**原因**：Vite 代理配置超时，网络无法直接访问 Vercel

**解决方案**：修改 API 基础 URL 配置，开发环境直接请求 Vercel API

```typescript
// client/src/lib/api.ts
const API_BASE_URL = import.meta.env.DEV
  ? 'https://storybook-gamma-ten.vercel.app/api'
  : '/api';
```

#### 3. 用户默认头像

**问题**：浏览器控制台显示 404 错误，缺少 `avatar-default.png`

**解决方案**：添加默认头像图片到 `client/public/images/avatar-default.png`

**Commit**: `b0e6188`

### 提交记录

| Commit ID | 说明 |
|-----------|------|
| b0e6188 | 新增：添加用户默认头像图片 |
| 28a286c | 配置：开发环境直接请求 Vercel API |
| 9773b87 | 新增：首页在线演示组件书页翻页效果 |

---

## [2026-01-21] 图片生成进度计数修复（JSONB 原子操作）

### 本次更新摘要
使用 PostgreSQL JSONB 原子追加操作解决 `generatedPages` 并发覆盖问题，确保进度计数准确。新增图片生成页面显示当前艺术风格。

### 详细内容

#### 1. generatedPages 并发覆盖问题修复

**问题现象**：
- 日志显示 `generatedPages=2` 重复多次，但 progress 持续增长
- 第 3 页生成成功后日志显示 "generatedPages 现在有 2 张"（应该是 3 张）
- 最终进度停留在 5/8 或 4/8，而不是 8/8

**根因分析**：
```
虽然 completed_items 有原子更新保护，但 result JSON 字段没有：

请求A（第二页）      请求B（第三页）
     │                   │
     ├─读取 result       ├─读取 result
     │  generatedPages=1 │  generatedPages=1 ← 旧数据！
     │                   │
     ├─原子更新          ├─原子更新
     │  completed_items=2│  completed_items=3
     │                   │
     ├─生成图片...       ├─生成图片...
     │                   │
     └─保存 result       └─保存 result
        [第1页,第2页]        [第1页,第3页] ← 覆盖！
```

**解决方案**：使用 PostgreSQL JSONB 函数在 SQL 中原子性地追加到数组

```sql
-- 原子追加到 generatedPages 数组
UPDATE tasks
SET result = jsonb_set(
  result,
  '{generatedPages}',
  COALESCE(result->'generatedPages', '[]'::jsonb) || 新数据::jsonb,
  true
)
WHERE id = ${taskId}
```

**Commit**: `88bff82`

#### 2. 新增：图片生成页面显示当前艺术风格

**修改位置**：`client/src/pages/Create.tsx`

在第四步图片生成页面，标题下方显示当前选择的艺术风格名称（如 "当前风格：扁平插画"）

**Commit**: `030e376`

### 测试结果

用户反馈："试了两次都成功了"

- ✅ 进度正确显示（1/8 → 2/8 → ... → 8/8）
- ✅ `generatedPages` 正确递增
- ✅ 并发请求不再相互覆盖
- ✅ 最终进度显示 8/8

### 提交记录

| Commit ID | 说明 |
|-----------|------|
| 88bff82 | 修复：使用 JSONB 原子追加解决 generatedPages 并发覆盖问题 |
| 030e376 | 新增：图片生成页面显示当前艺术风格 |

---

## [2026-01-21] 图片生成并发控制与显示同步修复

### 本次更新摘要
修复图片生成过程中的多个并发问题，包括图片重复生成、显示顺序错位、最后一张图未生成等。

### 详细内容

#### 1. 删除草稿/作品时同步清理图片
- **问题**：删除草稿或作品后，Vercel Blob 中存储的图片没有被删除
- **修复**：在删除操作前先查询所有关联图片 URL，然后逐个调用 `del()` 删除
- **Commit**: `5f3a15e`

#### 2. 全部重新生成功能修复
- **问题**：点击"全部重新生成"只重新生成第一张图片，后续图片被跳过
- **原因**：`forceRegenerate` 参数没有从前端传递到后端
- **修复**：前端 API 添加参数，调用时传递给后端
- **Commit**: `83da91b`

#### 3. 保留 forceRegenerate 标志
- **问题**：第一张图片生成后，`forceRegenerate` 标志从 result 中丢失
- **修复**：更新 result 时保留 `forceRegenerate` 标志
- **Commit**: `e881959`

#### 4. 图片生成轮询导致重复生成
- **问题**：同一张图片被生成多次（第2张生成4次，第3张生成2次）
- **原因**：`useCreate` hook 每次返回新对象引用，导致 `useEffect` 被意外触发
- **修复**：使用 `useMemo` 稳定对象引用，移除冲突的同步定时器
- **Commit**: `886f437`

#### 5. 后端并发问题（根本原因）
- **问题**：多个请求同时读取相同的 `completed_items`，导致同一页被多次处理
- **原因**：在读取 `completed_items` 和更新 `completed_items` 之间存在时间窗口
- **修复**：使用 PostgreSQL 原子更新 + RETURNING
```javascript
const updateResult = await sql`
  UPDATE tasks
  SET completed_items = completed_items + 1
  WHERE id = ${taskId}
  RETURNING completed_items, total_items
`;
```
- **Commit**: `939113b`, `101e13a`

#### 6. 防止 completed_items 超出 total_items
- **问题**：日志显示"处理第 9 页"，但一共只有 8 张图片
- **修复**：原子更新时添加 `completed_items < total_items` 条件
- **Commit**: `0d737a3`

#### 7. 图片显示顺序错位和同步问题
- **问题1**：图片显示错位（显示第2-7张，没有第1张）
  - **原因**：`Object.entries()` 返回的键值对顺序不确定
  - **修复**：对键进行排序

- **问题2**：图片没有正确同步
  - **原因**：前端只更新单张图片，第一张图没有同步
  - **修复**：continue 接口返回 `pages` 数组，前端用它同步所有图片

- **Commit**: `f00afb2`

### 待解决问题
- **最后一张图片没有生成**：不管是重新全部生成还是新建绘本，最后一张图片都没有生成
- **状态**：已记录，下次会话解决

### 提交记录

| Commit ID | 说明 |
|-----------|------|
| 5f3a15e | 功能：删除草稿/作品时同步清理 Vercel Blob 图片 |
| 83da91b | 修复：全部重新生成时正确传递 forceRegenerate 参数 |
| e881959 | 修复：生成第一张图片后保留 forceRegenerate 标志 |
| 886f437 | 修复：图片生成轮询导致重复生成和进度显示问题 |
| 939113b | 修复：使用原子更新解决图片重复生成问题 |
| 101e13a | 修复：使用原子更新解决图片重复生成问题（第2版） |
| 0d737a3 | 修复：防止 completed_items 超出 total_items 和前端跳过图片不显示问题 |
| f00afb2 | 修复：图片显示顺序错位和同步问题 |

---

## [2026-01-20] 图片生成问题修复与旧图片自动删除

### 本次更新摘要
彻底修复图片生成卡住和重新生成失败的问题，实现旧图片自动删除功能，修复多个类型定义和模块导入问题。

### 详细内容

#### 1. 核心问题修复

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 单张图片重新生成失败 | `pageImages` 键类型不一致（数字 vs 字符串） | 统一使用字符串键 |
| 全部重新生成无响应 | 从分镜页面生成时未设置 `forceRegenerate` | 自动检测并设置标志 |
| 重新生成后显示旧图片 | `startImageGeneration` 清空了 `pageImages` | 仅在强制重新生成时清空 |
| 数据库字段不存在 | `storyboard_pages` 表缺少 `updated_at` 字段 | 自动迁移添加字段 |
| 登录失败（500 错误） | Vercel ESM 模块导入路径问题 | 内联函数避免外部导入 |

#### 2. 新增功能：旧图片自动删除

**实现位置**：
- 单张图片生成：`api/index.ts:2229-2238`
- 批量生成图片（第一张）：`api/index.ts:2476-2484`
- continue 接口（后续图片）：`api/index.ts:2871-2880`

**删除逻辑**：
```typescript
// 1. 保存旧图片 URL
const oldImageUrl = page.image_url;

// 2. 上传新图片并更新数据库（成功后）
await sql`UPDATE storyboard_pages SET image_url = ${finalImageUrl}...`;

// 3. 删除旧图片
if (oldImageUrl && oldImageUrl.includes('vercel-storage.com')) {
  await del(oldImageUrl);
}
```

**安全性保证**：
- 只有新图片成功上传并更新数据库后才删除旧图片
- 删除失败不影响主流程，只记录日志

#### 3. 数据库迁移自动化

**新增函数**：`migrateDatabase()` 内联在 `api/index.ts`

**功能**：
- API 启动时自动检测 `storyboard_pages.updated_at` 字段是否存在
- 如不存在则自动添加
- 使用 `information_schema` 检查，兼容性更好

#### 4. 类型定义完善

**修改文件**：`client/src/lib/api.ts`

| 接口 | 新增字段 |
|------|----------|
| `TaskResponse` | `pageNumber`, `imageUrl`, `skipped` |
| `Draft` | `artStyle` |
| `TemplateDetail` | 修复 `previewPages` 类型冲突 |

#### 5. Bug 修复详情

**前端 (`useCreate.ts`)**：
- `restoreFromDraft`：使用字符串键
- `checkTaskStatus`：使用字符串键
- `continueImageGeneration`：使用字符串键
- 移除不必要的 `as any` 类型断言

**前端 (`Create.tsx`)**：
- `handleStartImageGeneration`：自动检测并设置 `forceRegenerate`
- 图片添加 `onError` 处理

**后端 (`api/index.ts`)**：
- 批量生成支持 `forceRegenerate` 重新生成第一张图片
- 三处添加旧图片删除逻辑
- 内联 `migrateDatabase` 函数

#### 6. 提交记录

| Commit ID | 说明 |
|-----------|------|
| 62ed177 | 调试：添加 SQL 查询结果的详细日志 |
| 8e7c126 | 修复：统一 pageImages 键类型为字符串 |
| 9646494 | 调试：添加前端图片生成的详细日志 |
| f2a54e9 | 修复：移除 storyboard_pages 表中不存在的 updated_at 字段 |
| b9b302c | 调试：添加 API 错误拦截器和后端日志 |
| 47daa53 | 功能：添加数据库迁移功能 |
| 617e0a7 | 修复：完善类型定义，移除不必要的 as any |
| 6916e9d | 功能：添加图片加载失败的错误处理 |
| 8ca276a | 修复：将 migrateDatabase 函数内联到 api/index.ts |
| 54eba39 | 功能：实现旧图片删除功能 |

### 当前项目状态

| 模块 | 状态 |
|------|------|
| 用户认证 | ✅ 完成 |
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成 |
| AI 图片生成 | ✅ 完成 |
| 图片重新生成（单张） | ✅ 完成 |
| 图片全部重新生成 | ✅ 完成 |
| 图片永久存储 | ✅ 完成（Vercel Blob） |
| 旧图片自动删除 | ✅ 完成 |
| 草稿保存/恢复 | ✅ 完成 |
| 图片风格保存 | ✅ 完成 |
| 数据库迁移自动化 | ✅ 完成 |
| 绘本预览/播放 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |
| 语音朗读 | ⏳ 待开发 |

### 下一步计划
- 开发绘本预览/播放功能
- 实现作品发布功能
- 集成语音朗读功能

---

## [2026-01-19] 图片风格保存与重新生成功能优化

### 本次更新摘要
修复草稿恢复后图片重新生成按钮无响应的问题，实现图片风格保存功能，优化重新生成逻辑使其支持事务安全的旧图片删除。

### 详细内容

#### 1. Bug 修复

| 问题 | 原因 | 修复 |
|------|------|------|
| 草稿恢复后重新生成按钮无响应 | 未恢复 `selectedArtStyle` 状态 | 添加 art style 恢复逻辑 |
| 重新生成后显示旧图片 | 未清除旧图片 URL | 添加 forceRegenerate 标志 |
| TypeScript 类型错误 | 缺少 forceRegenerate 类型定义 | 添加类型定义 |
| 草稿详情接口 SQL 错误 | 数据库未迁移 art_style 字段 | 使用 try-catch 兼容处理 |

#### 2. 新增功能

**图片风格保存**：
- 数据库 `works` 表新增 `art_style` 字段
- 生成图片时保存风格到数据库
- 重新生成时默认使用保存的风格

**重新生成优化**：
- 使用 `forceRegenerate` 标志控制是否强制重新生成
- 先生成新图片，再更新数据库，最后删除旧图片（事务安全）

#### 3. 代码修改

**后端 (`api/index.ts`)**：
- 添加 `forceRegenerate` 标志到任务结果
- 批量生成时保存 art style
- continue 接口支持强制重新生成
- 草稿详情接口兼容无 art_style 字段的情况

**前端 (`client/src/pages/Create.tsx`)**：
- 草稿恢复时恢复 art style 选择

#### 4. 数据库迁移

迁移命令位于 `api/index.ts`：
```typescript
ALTER TABLE works ADD COLUMN IF NOT EXISTS art_style VARCHAR(50);
```

**执行状态**：✅ 已执行（2026-01-19）

#### 5. 提交记录

| Commit ID | 说明 |
|-----------|------|
| 11da919 | 修复：草稿恢复后图片重新生成功能 |
| 219f95f | 优化：图片风格保存与重新生成逻辑 |
| 08fb115 | 修复：TypeScript 类型错误 |
| 8c70683 | 修复：草稿详情接口兼容性问题 |

### 待解决问题

- **图片生成卡住**：新建故事时，图片生成进度卡在第二张不动，后台有生成记录但前端未显示
- **旧图片删除**：旧图片 URL 仅记录，实际从 Vercel Blob 删除待实现

### 当前项目状态

| 模块 | 状态 |
|------|------|
| 用户认证 | ✅ 完成 |
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成 |
| AI 图片生成 | ⚠️ 有待修复问题 |
| 图片永久存储 | ✅ 完成（Vercel Blob） |
| 草稿保存/恢复 | ✅ 完成 |
| 草稿管理 | ✅ 完成 |
| 图片风格保存 | ✅ 完成 |
| 绘本预览/播放 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |
| 语音朗读 | ⏳ 待开发 |

### 下一步计划
- 修复图片生成卡住问题（轮询/状态同步）
- ~~执行数据库迁移~~ ✅ 已完成
- 实现旧图片删除功能
- 开发绘本预览/播放功能

---

## [2026-01-16] 图片存储迁移与 Bug 修复

### 本次更新摘要
将图片存储从硅基流动临时 URL 迁移到 Vercel Blob 永久存储，修复图片生成进度显示、草稿恢复等多个 Bug。

### 详细内容

#### 1. 图片存储迁移到 Vercel Blob

| 项目 | 说明 |
|------|------|
| 存储服务 | Vercel Blob |
| 存储路径 | `storybook/{workId}/page-{pageNumber}-{timestamp}.png` |
| 访问方式 | 永久公开 URL |

**流程变化**：
```
之前：硅基流动生成 → 返回临时 URL → 存到数据库
现在：硅基流动生成 → 下载图片 → 上传 Vercel Blob → 存永久 URL
```

#### 2. Bug 修复

| 问题 | 原因 | 修复 |
|------|------|------|
| 进度显示不更新 | 后端返回缺少 completedItems/totalItems | 添加字段到所有返回点 |
| 生成完成后转圈 | 同上 | 同上 |
| 草稿恢复到错误步骤 | current_step 设为 'images' 而非 'preview' | 改为 'preview' |
| 恢复后无法点下一步 | imageTask.status 未恢复 | 恢复时设置为 'completed' |

#### 3. 新增测试端点

| 端点 | 功能 |
|------|------|
| `/api/test-blob` | 测试 Vercel Blob 配置 |

#### 4. 数据库初始化改进

- 支持 GET 请求访问 `/api/db/init`
- 移除 secret 验证，简化初始化流程

#### 5. 代码修改

**后端 (`api/index.ts`)**：
- 导入 `@vercel/blob` 的 `put` 函数
- 添加 `uploadImageToBlob` 辅助函数
- 图片生成后上传到 Blob
- 修复所有返回点添加进度字段
- 图片完成后更新 work.current_step 为 'preview'

**前端**：
- `useCreate.ts` - 恢复草稿时设置 imageTask 状态
- `Create.tsx` - 添加 'preview' 步骤映射

#### 6. 新增依赖

```json
"@vercel/blob": "^2.0.0"
```

### 当前项目状态

| 模块 | 状态 |
|------|------|
| 用户认证 | ✅ 完成 |
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成 |
| AI 图片生成 | ✅ 完成 |
| 图片永久存储 | ✅ 完成（Vercel Blob） |
| 草稿保存/恢复 | ✅ 完成 |
| 草稿管理 | ✅ 完成 |
| 绘本预览/播放 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |
| 语音朗读 | ⏳ 待开发 |

### 下一步计划
- 开发绘本预览/播放功能
- 实现作品发布功能
- 集成语音朗读功能

---

## [2026-01-15] 图片生成功能开发

### 本次更新摘要
完成图片生成功能开发，集成硅基流动（SiliconFlow）API，支持使用 Kolors 模型生成绘本插图。

### 详细内容

#### 1. 图片生成 API 尝试历程

| 服务商 | 状态 | 问题 |
|--------|------|------|
| 即梦（火山引擎） | ❌ 失败 | 免费试用版无法通过 API 调用 |
| Google Imagen | ❌ 失败 | 中国大陆不在免费政策范围内 |
| 硅基流动 | ✅ 成功 | 国内服务，有免费额度 |

#### 2. 硅基流动集成

- **API 端点**：`https://api.siliconflow.cn/v1/images/generations`
- **使用模型**：`Kwai-Kolors/Kolors`（免费）
- **测试端点**：`/api/test-siliconflow`、`/api/test-siliconflow-full`

#### 3. 新增 API 路由

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/create/images` | POST | 批量生成分镜图片 |
| `/api/create/task/:id` | GET | 查询任务状态 |
| `/api/create/task/:id/continue` | POST | 继续生成下一张图片 |

#### 4. 代码修改

**后端**：
- `api/_lib/image.ts` - 添加硅基流动提供商
- `api/index.ts` - 添加图片生成路由（内联实现）
- `api/routes/create.ts` - 更新 provider 类型

**前端**：
- `client/src/lib/api.ts` - 添加 `siliconflow` 类型
- `client/src/pages/Create.tsx` - 默认使用硅基流动

#### 5. 环境变量

| 变量名 | 说明 |
|--------|------|
| `IMAGE_PROVIDER` | 设置为 `siliconflow` |
| `SILICONFLOW_API_KEY` | 硅基流动 API Key |

#### 6. 遇到的问题与解决

1. **即梦 API 权限**：免费试用版无法 API 调用 → 放弃
2. **Google API 地区限制**：配额为 0 → 放弃
3. **Vercel 模块导入失败**：动态导入路径问题 → 改为内联实现
4. **静态导入导致崩溃**：循环依赖 → 移除静态导入

### 当前项目状态

| 模块 | 状态 |
|------|------|
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成 |
| AI 图片生成 | ✅ 完成（硅基流动） |
| 草稿保存 | ✅ 完成 |
| 草稿管理 | ✅ 完成 |
| 绘本预览 | ⏳ 待开发 |
| 作品发布 | ⏳ 待开发 |

### 下一步计划
- 验证图片生成完整流程
- 开发绘本预览/播放功能
- 实现作品发布功能

---

## [2026-01-12] 分镜生成、草稿系统、作品管理

### 本次更新摘要
完成分镜生成功能、草稿自动保存系统、作品管理 API，以及多个 Bug 修复。

### 详细内容

#### 1. 分镜生成功能
- **API 端点**：`POST /api/create/storyboard`
- **功能**：将故事内容转化为绘本分镜，每页包含文字和画面描述
- **技术方案**：放弃 JSON 格式，改用纯文本分隔符格式（更可靠）
- **输出格式**：
  ```
  ---第1页---
  文字：故事文字内容
  画面：详细的画面描述
  ```

#### 2. 草稿自动保存系统
- **设计理念**：一个草稿（work）= 一次完整的创作流程
- **数据库更新**：`works` 表新增 `current_step`、`theme`、`child_name`、`child_age`、`style`、`length` 字段
- **自动保存时机**：
  - 生成故事 → 创建 work + story
  - 生成分镜 → 创建 storyboard + pages
  - 生成图片 → 更新 pages.image_url

#### 3. 作品管理 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/works` | GET | 获取用户作品列表 |
| `/api/works/:id` | GET | 获取作品详情 |
| `/api/works/:id` | DELETE | 删除作品 |
| `/api/drafts` | GET | 获取草稿列表 |
| `/api/drafts/:id` | GET | 获取草稿详情 |
| `/api/drafts/:id` | DELETE | 删除草稿 |

#### 4. 前端草稿功能
- 我的作品页面显示草稿列表
- 编辑按钮跳转到 `/create?draft=xxx`
- 创作页面自动恢复草稿状态
- useCreate Hook 新增 `workId` 和 `restoreFromDraft()`

#### 5. Bug 修复
- 数据库迁移：添加 ALTER TABLE 语句
- 请求超时：axios 超时从 30 秒增加到 2 分钟
- 数据库保存重试：失败时自动重试 3 次
- 编辑按钮无反应：添加 e.stopPropagation()
- 分镜 JSON 解析失败：改用纯文本格式

### 当前项目状态
| 模块 | 状态 |
|------|------|
| AI 故事生成 | ✅ 完成 |
| AI 分镜生成 | ✅ 完成 |
| 草稿保存 | ✅ 完成 |
| 草稿管理 | ✅ 完成 |
| 图片生成 | ⏳ 待开发 |
| 绘本预览 | ⏳ 待开发 |

### 下一步计划
- 图片生成功能（需要图片生成 API）
- 绘本预览/播放功能
- 作品发布功能

---

## [2026-01-11] 核心功能开发：数据库、认证、AI 故事生成、限流

### 本次更新摘要
完成项目核心功能开发，包括 API 路由修复、数据库配置、用户认证系统、AI 故事生成功能以及请求限流功能。

### 详细内容

#### 1. 修复 Vercel API 404 问题
- **问题**：原 `[...route].ts` 语法不被 Vite 项目支持
- **解决**：创建 `api/index.ts` 使用原生 Vercel 处理方式，配置 rewrites 规则

#### 2. 配置 Vercel Postgres 数据库
- 连接 Neon Postgres 数据库
- 初始化 10 张数据表（含新增的 rate_limits 表）
- 配置环境变量

#### 3. 实现用户认证系统
| 端点 | 功能 |
|------|------|
| `POST /api/auth/register` | 用户注册 |
| `POST /api/auth/login` | 用户登录 |
| `GET /api/user/me` | 获取当前用户 |

- JWT Token 认证（7天有效期）
- bcrypt 密码加密
- CORS 跨域支持

#### 4. 修复前端问题
- SPA 路由 404 问题（添加 rewrites 规则）
- Header 硬编码登录状态（改用 AuthContext）

#### 5. 配置 AI 故事生成功能
- 第三方 Claude API 配置（OpenAI 兼容格式）
- 创建 Prompt 配置文件 `api/prompts.config.ts`
- 实现 `/api/create/story` 端点

#### 6. 实现 AI 请求限流功能
| 限制类型 | 限制值 |
|---------|--------|
| 每用户每分钟 | 2 次 |
| 每用户每小时 | 20 次 |

- 使用数据库持久化限流记录
- 触发限流时返回友好提示

#### 7. 清理版本控制
- 移除截图文件
- 更新 `.gitignore`

### 当前项目状态
| 模块 | 状态 |
|------|------|
| 前端 UI | ✅ 完成 |
| 数据库 | ✅ 完成 |
| 用户认证 | ✅ 完成 |
| AI 故事生成 | ✅ 完成 |
| 请求限流 | ✅ 完成 |
| 分镜生成 | ⏳ 待开发 |
| 图片生成 | ⏳ 待开发 |

### 下一步计划
- 实现分镜生成功能
- 集成图片生成服务
- 完善作品管理 API

---

## [2026-01-10] API 重构：使用 Hono 合并为单一 Serverless Function

### 本次更新摘要
解决 Vercel Hobby 计划限制（最多 12 个 Serverless Functions），使用 Hono 框架将 14 个独立 API 函数重构为 1 个统一入口。

### 问题背景
```
Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```
项目原有 14 个独立 API 文件，超出 Vercel 免费计划限制。

### 解决方案
使用 **Hono** 轻量级路由框架，将所有 API 端点合并到单一入口文件 `api/index.ts`。

### 详细内容

#### 1. 新增文件

| 文件 | 功能 |
|------|------|
| `api/index.ts` | 统一入口，Hono 路由分发 |
| `api/_lib/hono-helpers.ts` | Hono 兼容的辅助函数 |
| `api/routes/auth.ts` | 认证路由模块 |
| `api/routes/user.ts` | 用户路由模块 |
| `api/routes/create.ts` | 创作路由模块 |
| `api/routes/db.ts` | 数据库路由模块 |

#### 2. 删除文件
删除原有 14 个独立 API 文件：
- `api/auth/register.ts`, `api/auth/login.ts`, `api/auth/logout.ts`
- `api/user/me.ts`, `api/user/profile.ts`, `api/user/password.ts`
- `api/create/story.ts`, `api/create/storyboard.ts`, `api/create/image.ts`, `api/create/images.ts`
- `api/create/task/[taskId].ts`, `api/create/task/[taskId]/continue.ts`
- `api/db/init.ts`, `api/health.ts`

#### 3. 修改文件

| 文件 | 修改内容 |
|------|----------|
| `vercel.json` | 路由重写规则：`/api/*` → `/api` |
| `api/_lib/validate.ts` | 修复 Zod v4 API：`errors` → `issues` |
| `package.json` | 添加 `hono@4.11.3` 依赖 |

#### 4. 修复的问题
- **Zod v4 API 变更**：`result.error.errors` → `result.error.issues`
- **TypeScript 类型推断**：使用 `'error' in validation` 进行类型守卫

### 代码统计
- 新增文件：5 个
- 删除文件：14 个
- 修改文件：3 个
- Serverless Functions：14 → 1

### 当前项目状态
- **前端 UI**: ✅ 完成
- **前端 API 对接**: ✅ 完成
- **后端 API 框架**: ✅ 完成 (Hono 单一入口)
- **Vercel 部署**: ✅ 完成
- **数据库**: ⏳ 待配置
- **环境变量**: ⏳ 待配置

### 下一步计划
- 创建 Vercel Postgres 数据库
- 配置环境变量
- 功能测试

---

## [2026-01-09] 后端 API 框架与前端页面对接

### 本次更新摘要
完成后端 API 框架搭建（Vercel Serverless Functions）和前端所有页面的 API 对接，实现完整的前后端集成架构。

### 详细内容

#### 1. 后端 API 设计
- 创建完整 API 设计文档 (`docs/api-design.md`)
- 设计 30 个接口，覆盖用户系统、故事创作、作品管理、模板系统、社区发布

#### 2. Vercel Serverless Functions 实现

**工具库 (`api/_lib/`)**：
| 文件 | 功能 |
|------|------|
| `response.ts` | 统一响应格式处理 |
| `auth.ts` | JWT Token 生成与验证 |
| `password.ts` | bcrypt 密码加密 |
| `validate.ts` | Zod 请求参数验证 |
| `db.ts` | 数据库 Schema 定义 (8张表) |
| `ai.ts` | 多 AI 提供商文本生成服务 |
| `image.ts` | 多提供商图片生成服务 |
| `prompts.ts` | 故事/分镜生成提示词 |

**API 端点 (14个)**：
- 认证：注册、登录、退出
- 用户：获取信息、更新资料、修改密码
- 创作：故事生成、分镜生成、图片生成、批量图片、任务查询、继续生成
- 系统：数据库初始化、健康检查

#### 3. 多 AI 提供商支持

**文本生成**：Claude、OpenAI GPT、Google Gemini、自定义 OpenAI 兼容接口

**图片生成**：DALL-E 3、Stability AI、Google Imagen 3、即梦 (Jimeng)、自定义接口

#### 4. 前端 API 对接

**新增文件**：
- `client/src/lib/api.ts` - API 客户端封装
- `client/src/contexts/AuthContext.tsx` - 用户认证状态管理
- `client/src/hooks/useCreate.ts` - 创作流程状态管理

**页面对接**：
| 页面 | 对接功能 |
|------|----------|
| Login.tsx | 登录、注册、表单验证 |
| Create.tsx | 5步向导、故事/分镜/图片生成 |
| MyWorks.tsx | 作品列表、删除、发布 |
| Gallery.tsx | 公开作品、点赞、搜索 |
| Templates.tsx | 模板列表、分类筛选 |
| AccountSettings.tsx | 资料修改、密码修改 |

#### 5. 图片生成策略
采用轮询模式避免 Vercel 10秒超时：
- 前端每2秒调用 continue 接口
- 逐张生成，实时显示进度

### 新增/修改的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `api/_lib/*.ts` | 新增 | 9个工具库文件 |
| `api/auth/*.ts` | 新增 | 3个认证接口 |
| `api/user/*.ts` | 新增 | 3个用户接口 |
| `api/create/*.ts` | 新增 | 6个创作接口 |
| `api/health.ts` | 新增 | 健康检查 |
| `api/db/init.ts` | 新增 | 数据库初始化 |
| `client/src/lib/api.ts` | 新增 | API 客户端 |
| `client/src/contexts/AuthContext.tsx` | 新增 | 认证 Context |
| `client/src/hooks/useCreate.ts` | 新增 | 创作 Hook |
| `client/src/pages/*.tsx` | 修改 | 6个页面对接 API |
| `vercel.json` | 修改 | 添加 API 路由配置 |
| `package.json` | 修改 | 添加后端依赖 |
| `docs/api-design.md` | 新增 | API 设计文档 |

### 代码统计
- 新增文件：27 个
- 修改文件：10 个
- 新增代码：7069 行

### 当前项目状态
- **前端 UI**: ✅ 完成
- **前端 API 对接**: ✅ 完成
- **后端 API 框架**: ✅ 完成
- **多 AI 提供商**: ✅ 完成
- **Vercel 部署配置**: ✅ 完成
- **数据库**: ⏳ 待配置 (Schema 已定义)
- **环境变量**: ⏳ 待配置 (API 密钥)

### 下一步计划
- 创建 Vercel Postgres 数据库
- 配置环境变量 (DATABASE_URL, JWT_SECRET, AI API Keys)
- 部署测试完整功能
- 实现剩余 API (作品管理、模板、社区)

---

## [2026-01-08] Vercel 部署配置与网站上线

### 本次更新摘要
完成 Vercel 部署配置，将柒柒の魔法绘本屋成功发布到互联网，可通过公网访问。

### 详细内容

#### 1. Vercel CLI 安装与配置
- 全局安装 Vercel CLI (v50.1.6)
- 完成 Vercel 账户身份验证 (anderuier)
- 关联本地项目到 Vercel 平台
- 自动连接 GitHub 仓库

#### 2. 部署问题修复
**问题**：首次部署后，访问网址显示后端 Express 代码源文件

**原因**：构建命令同时构建前后端，Vercel 把 `dist/index.js` 当作静态文件提供

**解决方案**：
- 创建 `vercel.json` 配置文件，指定只构建前端
- 在 `package.json` 添加 `build:client` 命令

#### 3. 成功部署
- **正式域名**：https://storybook-gamma-ten.vercel.app
- **自动部署**：每次 `git push` 会自动触发重新部署

#### 4. 新增文档
- `docs/vercel-deployment-guide.md` - Vercel 部署指南

### 新增/修改的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vercel.json` | 新增 | Vercel 部署配置 |
| `package.json` | 修改 | 添加 build:client 命令 |
| `docs/vercel-deployment-guide.md` | 新增 | 部署指南文档 |
| `.gitignore` | 修改 | 排除 .vercel 目录 |

### 当前项目状态
- **前端页面**: ✅ 完整（首页 + 8个二级页面）
- **响应式设计**: ✅ 完成
- **Vercel 部署**: ✅ 完成
- **网站上线**: ✅ https://storybook-gamma-ten.vercel.app
- **后端业务**: ❌ 未实现
- **AI 功能**: ❌ 未实现
- **数据库**: ❌ 未实现

### 下一步计划
- 设计后端 API 接口结构
- 实现 Vercel Serverless Functions
- 集成 AI 故事生成功能
- 集成 AI 图片生成功能
- 实现用户认证系统

---

## [2026-01-06] 前端页面完善与二级页面开发

### 本次更新摘要
完成前端响应式优化、导航功能完善、8个二级页面开发、用户中心功能实现。

### 详细内容

#### 1. 响应式布局优化
- **Hero Section**: 统计数据在小屏幕使用 grid 布局，字体自适应
- **PricingSection**: 价格表格在小屏幕改为上下布局
- **DemoSection**: 控制栏在移动端垂直排列，按钮文字响应式隐藏
- **Footer**: 底部链接支持换行，居中对齐

#### 2. 导航功能完善
- Header 导航添加平滑滚动效果
- 非首页点击锚点链接自动跳转首页对应位置
- 更新 Footer 快速链接

#### 3. 首页内容更新
- 替换导航标签：技术架构→模板库、成本估算→作品广场、发展规划→关于我们
- 新增 **TemplateSection** 组件（模板库展示，6个精选模板，分类筛选）
- 新增 **GallerySection** 组件（作品广场展示，6个示例作品，排序切换）
- 新增 **AboutSection** 组件（关于我们，品牌故事，价值观，数据里程碑）
- **DemoSection** 扩展为7页完整故事演示

#### 4. 新增二级页面（8个）

| 路由 | 页面名称 | 功能描述 |
|------|----------|----------|
| `/create` | 创作页面 | 4步创作向导：选择模式→输入内容→选择风格→选择语音 |
| `/login` | 登录/注册 | 邮箱登录、注册切换、第三方登录（Google/微信） |
| `/templates` | 模板库 | 12个模板、分类筛选、搜索功能 |
| `/gallery` | 作品广场 | 12个作品、排序切换（最热/最新/精选）、搜索功能 |
| `/help` | 帮助中心 | FAQ分类、搜索、11个常见问题解答 |
| `/contact` | 联系我们 | 联系表单、联系方式、工作时间 |
| `/my-works` | 我的作品 | 用户作品列表、筛选（全部/已发布/草稿）、操作菜单 |
| `/settings` | 账户设置 | 个人资料、账户安全、通知设置、偏好设置 |

#### 5. 用户中心功能
- Header 添加用户下拉菜单（登录状态显示头像和昵称）
- 下拉菜单包含：我的作品、创作新绘本、账户设置、退出登录
- 移动端菜单同步支持登录状态显示

#### 6. 按钮链接更新
所有按钮已关联对应页面：
- 开始创作 → `/create`
- 登录 → `/login`
- 查看全部模板 → `/templates`
- 浏览更多作品 → `/gallery`
- 联系我们 → `/contact`
- 帮助中心 → `/help`
- 我的作品 → `/my-works`
- 账户设置 → `/settings`

#### 7. 新增图片资源（26张）
- 演示页面图片：`demo-page-1.png` ~ `demo-page-7.png`
- 模板封面图片：`template-forest/ocean/space/princess/farm/seasons.png`
- 作品封面图片：`work-1.png` ~ `work-6.png`
- 用户头像图片：`avatar-1.png` ~ `avatar-6.png`
- 关于我们图片：`about-story.png`

### 代码统计
- 文件变更：43 个
- 新增代码：3400+ 行
- 新增页面：8 个
- 新增组件：3 个
- 新增图片：26 张

### 当前项目状态
- **前端页面**: ✅ 完整（首页 + 8个二级页面）
- **响应式设计**: ✅ 完成
- **用户中心**: ✅ 完成（模拟登录状态）
- **后端业务**: ❌ 未实现
- **AI 功能**: ❌ 未实现
- **数据库**: ❌ 未实现

### 下一步计划
- 实现用户认证系统（真实登录/注册）
- 开发后端 API 接口
- 集成 AI 故事生成功能
- 集成 AI 图片生成功能
- 数据库设计与集成

---

## [2026-01-06] 文档完善与开发环境配置

### 本次更新摘要
完成 Git 远程仓库推送、Claude Code 规则配置、项目文档体系建立、TortoiseGit 安装。

### 详细内容

#### 1. Git 远程仓库推送
- 重命名分支为 `main`
- 配置 Git 代理 (127.0.0.1:7890)
- 成功推送代码到 GitHub
- 仓库地址: https://github.com/anderuier/qiqi-storybook-platform

#### 2. 环境配置
- 创建 `.env` 环境变量文件
- 配置 Umami 分析服务占位变量
- 删除 Windows 保留文件 `nul`

#### 3. Claude Code 规则配置
- 创建并完善 `CLAUDE.md` 规则文件
- 配置文档管理规则（DOCS/ 文件夹）
- 配置会话总结规则（触发词机制）
- 配置项目进展记录规则（CHANGELOG.md）

#### 4. 文档体系建立
新增以下文档：
- `tech-overview.md` - 技术架构通俗解读
- `git-daily-usage.md` - Git 日常使用教程（对比 SVN）
- `project-structure-guide.md` - 项目结构详解与开发指南
- `SESSION_SUMMARY_20260106_003253.md` - 本次会话总结

#### 5. 开发工具
- 安装 TortoiseGit（SSH 选择 OpenSSH）
- 讲解 Git 与 SVN 的区别
- 讲解 TortoiseGit 使用方法

#### 6. 知识讲解
- 现代前端技术栈概述
- 项目目录结构详解
- 前后端分工说明
- Git 工作流程讲解

### 当前项目状态
- **前端**: 展示页面完整可用
- **后端**: 仅静态文件服务
- **Git**: 已关联 GitHub，代码已推送
- **文档**: 完整文档体系已建立（8个文档）
- **开发工具**: TortoiseGit 已安装

### 下一步计划
- 提交本次会话的更改到 Git
- 配置 Umami 网站分析（可选）
- 开始后端业务逻辑开发

---

## [2026-01-05] 项目初始化与环境配置

### 本次更新摘要
完成项目从 Manus 导出后的本地环境配置、Git 版本控制初始化、GitHub 远程仓库关联。

### 详细内容

#### 1. 项目分析
- 完成项目技术架构完整分析
- 生成 `project-analysis.md` 分析报告
- 评估项目完整性：前端完善，后端待开发

#### 2. 环境配置
- 安装项目依赖 (618个包)
- 启动开发服务器 (http://localhost:3000)
- 创建 `.env` 环境变量文件

#### 3. Git 版本控制
- 初始化 Git 仓库
- 配置用户信息 (anderuier / anderuier@163.com)
- 修复 `.gitignore` (添加 Windows 保留文件名规则)
- 创建初始提交 (361c949)
- 重命名分支为 `main`

#### 4. GitHub 远程仓库
- 关联远程仓库: https://github.com/anderuier/qiqi-storybook-platform
- 配置 Git 代理 (127.0.0.1:7890)
- 成功推送代码到 GitHub

#### 5. 文档创建
- `project-analysis.md` - 项目技术架构分析
- `SESSION_SUMMARY.md` - 会话总结
- `git-setup-tutorial.md` - Git 仓库建立教程
- `tech-overview.md` - 技术架构通俗解读
- `CLAUDE.md` - Claude Code 规则文件
- `CHANGELOG.md` - 项目更新日志（本文件）

#### 6. 其他
- 删除 Windows 保留文件 `nul`
- 创建 `DOCS/` 文件夹统一管理文档
- 移动所有文档到 `DOCS/` 文件夹

### 当前项目状态
- **前端**: 展示页面完整可用
- **后端**: 仅静态文件服务
- **Git**: 已关联 GitHub，代码已推送
- **文档**: 基础文档已创建

### 下一步计划
- 配置 Umami 网站分析
- 开始后端业务逻辑开发
- 实现 AI 故事生成功能

---

*文件创建: 2026-01-05*
