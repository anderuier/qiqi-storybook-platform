# 项目结构详解与开发指南

**适合读者**: 想要了解项目整体结构并开始开发的开发者

---

## 一、项目结构总览

```
D:\storybook\
│
├── 📁 client/                    # 前端代码
│   ├── index.html               # 入口 HTML
│   ├── public/                  # 静态资源（图片等）
│   └── src/                     # 源代码
│       ├── main.tsx            # 应用入口
│       ├── App.tsx             # 根组件（路由配置）
│       ├── index.css           # 全局样式
│       ├── components/         # 13 个组件文件夹（含 65 个组件）
│       ├── pages/              # 页面组件
│       │   ├── Home.tsx       # 首页
│       │   └── NotFound.tsx   # 404 页面
│       ├── hooks/              # 自定义 Hooks
│       ├── contexts/           # React Context
│       └── lib/                # 工具函数
│
├── 📁 server/                    # 后端代码
│   └── index.ts                # Express 服务器
│
├── 📁 shared/                    # 前后端共享代码
│   └── const.ts                # 共享常量
│
├── 📁 node_modules/              # 依赖包（自动生成，不要手动修改）
├── 📁 patches/                   # 依赖补丁
├── 📁 DOCS/                      # 项目文档
├── 📁 .git/                      # Git 仓库（隐藏文件夹）
├── 📁 .claude/                   # Claude Code 配置
│
├── 📄 package.json              # 项目配置（依赖、脚本）
├── 📄 pnpm-lock.yaml            # 依赖锁定文件
├── 📄 vite.config.ts            # Vite 构建配置
├── 📄 tsconfig.json             # TypeScript 配置
├── 📄 components.json           # shadcn/ui 组件配置
├── 📄 .env                      # 环境变量
├── 📄 .gitignore                # Git 忽略规则
├── 📄 .prettierrc               # 代码格式化配置
├── 📄 CLAUDE.md                 # Claude Code 规则
└── 📄 ideas.md                  # 产品设计理念
```

---

## 二、各部分详细说明

### 核心代码目录

| 文件/文件夹 | 作用 | 你需要修改吗 |
|-------------|------|-------------|
| `client/src/` | 前端源代码 | ✅ 主要在这里开发 |
| `server/` | 后端代码 | ✅ 添加 API 时修改 |
| `shared/` | 前后端共享 | ✅ 共享类型/常量 |

### 配置文件

| 文件 | 作用 | 你需要修改吗 |
|------|------|-------------|
| `package.json` | 项目配置、依赖列表、脚本命令 | ⚠️ 添加依赖时修改 |
| `vite.config.ts` | Vite 构建工具配置 | ⚠️ 一般不需要改 |
| `tsconfig.json` | TypeScript 编译配置 | ⚠️ 一般不需要改 |
| `components.json` | shadcn/ui 组件库配置 | ⚠️ 一般不需要改 |
| `.env` | 环境变量（API 密钥等） | ✅ 配置敏感信息 |
| `.prettierrc` | 代码格式化规则 | ⚠️ 按需调整 |
| `.gitignore` | Git 忽略规则 | ⚠️ 按需添加 |

### 自动生成/不要修改

| 文件/文件夹 | 作用 | 说明 |
|-------------|------|------|
| `node_modules/` | 依赖包 | ❌ 由 pnpm install 自动生成 |
| `pnpm-lock.yaml` | 依赖版本锁定 | ❌ 自动维护 |
| `.git/` | Git 版本历史 | ❌ 由 Git 命令管理 |
| `patches/` | 依赖补丁 | ❌ 一般不需要改 |

### 文档目录

| 文件/文件夹 | 作用 |
|-------------|------|
| `DOCS/` | 项目文档存放目录 |
| `CLAUDE.md` | Claude Code 规则文件 |
| `ideas.md` | 产品设计理念和规划 |

---

## 三、前端代码结构详解

### client/src/ 目录

```
client/src/
├── main.tsx           # 应用入口点
├── App.tsx            # 根组件，定义路由
├── index.css          # 全局样式（Tailwind 配置）
├── const.ts           # 前端常量
│
├── pages/             # 页面组件
│   ├── Home.tsx      # 首页（主要展示页面）
│   └── NotFound.tsx  # 404 错误页面
│
├── components/        # 可复用组件
│   ├── ui/           # 基础 UI 组件（按钮、输入框等）
│   ├── Header.tsx    # 页头组件
│   ├── Footer.tsx    # 页脚组件
│   ├── Hero.tsx      # 首屏���图组件
│   └── ...           # 其他业务组件
│
├── hooks/             # 自定义 React Hooks
│   └── use-xxx.ts    # 可复用的逻辑
│
├── contexts/          # React Context（全局状态）
│   └── xxx-context.tsx
│
└── lib/               # 工具函数库
    └── utils.ts      # 通用工具函数
```

### 文件作用说明

| 文件 | 作用 |
|------|------|
| `main.tsx` | 应用启动入口，挂载 React 到 DOM |
| `App.tsx` | 定义路由规则，决定 URL 对应哪个页面 |
| `index.css` | Tailwind CSS 配置和全局样式 |
| `pages/*.tsx` | 页面级组件，对应不同的 URL |
| `components/*.tsx` | 可复用的 UI 组件 |
| `hooks/*.ts` | 可复用的逻辑（如数据获取、状态管理） |
| `contexts/*.tsx` | 全局状态管理（如用户登录状态） |
| `lib/*.ts` | 工具函数（如格式化、验证等） |

---

## 四、后端代码结构

### server/ 目录

```
server/
└── index.ts          # Express 服务器入口
```

### 当前后端功能

目前后端只提供**静态文件服务**，即把前端构建后的文件发送给浏览器。

```typescript
// server/index.ts 主要内容
import express from 'express';
const app = express();

// 提供静态文件
app.use(express.static('dist/public'));

// 启动服务器
app.listen(3000);
```

### 后续需要添加

- API 路由（如 `/api/stories`）
- 数据库连接
- 用户认证
- AI 服务集成

---

## 五、项目完整性评估

### 已完成部分

| 方面 | 状态 | 说明 |
|------|------|------|
| 前端框架 | ✅ 完整 | React 19 + TypeScript |
| 构建工具 | ✅ 完整 | Vite 配置完善 |
| 样式系统 | ✅ 完整 | Tailwind CSS 4 |
| UI 组件库 | ✅ 完整 | 65 个 shadcn/ui 组件 |
| 路由系统 | ✅ 完整 | Wouter 轻量路由 |
| 动画效果 | ✅ 完整 | Framer Motion |
| 响应式设计 | ✅ 完整 | 支持手机/平板/电脑 |
| 后端框架 | ✅ 基础 | Express 骨架 |

### 待实现部分

| 方面 | 状态 | 说明 |
|------|------|------|
| 后端 API | ❌ 无 | 需要添加业务接口 |
| 数据库 | ❌ 无 | 需要选择并集成 |
| 用户认证 | ❌ 无 | 需要实现登录注册 |
| AI 功能 | ❌ 无 | 故事生成、图片生成等 |

---

## 六、开发指南

### 1. 修改现有页面

**修改首页内容**：
```
编辑文件：client/src/pages/Home.tsx
```

**修改组件样式**：
```
编辑文件：client/src/components/xxx.tsx
使用 Tailwind CSS 类名修改样式
```

### 2. 添加新页面

**步骤**：

1. 在 `client/src/pages/` 创建新文件：
```tsx
// client/src/pages/About.tsx
export default function About() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">关于我们</h1>
      <p>这是关于页面的内容...</p>
    </div>
  );
}
```

2. 在 `App.tsx` 中添加路由：
```tsx
import About from './pages/About';

// 在路由配置中添加
<Route path="/about" component={About} />
```

### 3. 添加新组件

**步骤**：

1. 在 `client/src/components/` 创建新文件：
```tsx
// client/src/components/MyButton.tsx
interface Props {
  text: string;
  onClick: () => void;
}

export function MyButton({ text, onClick }: Props) {
  return (
    <button
      className="bg-blue-500 text-white px-4 py-2 rounded"
      onClick={onClick}
    >
      {text}
    </button>
  );
}
```

2. 在需要的地方导入使用：
```tsx
import { MyButton } from '../components/MyButton';

<MyButton text="点击我" onClick={() => alert('clicked!')} />
```

### 4. 添加后端 API

**步骤**：

1. 在 `server/index.ts` 中添加路由：
```typescript
// 添加 API 路由
app.get('/api/stories', (req, res) => {
  res.json({ stories: [] });
});

app.post('/api/stories', (req, res) => {
  // 处理创建故事的逻辑
  res.json({ success: true });
});
```

2. 前端调用 API：
```tsx
import axios from 'axios';

// 获取数据
const response = await axios.get('/api/stories');
console.log(response.data);

// 发送数据
await axios.post('/api/stories', { title: '新故事' });
```

### 5. 添加新依赖

```bash
# 添加生产依赖（运行时需要）
pnpm add 包名

# 添加开发依赖（仅开发时需要）
pnpm add -D 包名

# 示例
pnpm add dayjs           # 日期处理库
pnpm add -D @types/xxx   # TypeScript 类型定义
```

---

## 七、常用开发命令

```bash
# 启动开发服务器（支持热更新）
pnpm dev

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start

# 代码格式化
pnpm format

# TypeScript 类型检查
pnpm check
```

---

## 八、开发工作流建议

### 日常开发流程

```
1. 启动开发服务器
   pnpm dev

2. 在浏览器打开 http://localhost:3000

3. 修改代码，浏览器自动刷新

4. 完成一个功能后，提交代码
   git add .
   git commit -m "feat: 添加xxx功能"
   git push
```

### 文件修改后的影响

| 修改的文件 | 需要重启吗 | 说明 |
|------------|-----------|------|
| `*.tsx` / `*.ts` | 不需要 | 自动热更新 |
| `*.css` | 不需要 | 自动热更新 |
| `vite.config.ts` | 需要 | 配置文件变更 |
| `package.json` | 需要 | 依赖变更后需重启 |
| `.env` | 需要 | 环境变量变更 |

---

## 九、总结

这个项目是一个**高质量的现代前端项目模板**：

- ✅ **结构清晰** - 符合现代前端最佳实践
- ✅ **配置完善** - 开箱即用，无需额外配置
- ✅ **UI 精美** - 童话风格设计，响应式布局
- ✅ **技术先进** - 使用最新版本的 React、Vite、Tailwind
- ⚠️ **后端待完善** - 核心业务功能需要你来实现

你可以直接在这个项目上继续开发，不需要从零开始搭建。

---

*创建日期: 2026-01-05*
*适用项目: 童话绘本工坊 (qiqi-storybook-platform)*
