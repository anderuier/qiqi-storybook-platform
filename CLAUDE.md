# 柒柒の魔法绘本屋 (qiqi-storybook-platform)

一个基于 AI 的交互式童话故事创作平台，帮助家长为 3-6 岁学龄前儿童创作个性化的绘本故事。

---

## 项目规则

### 文档管理
1. 所有生成的文档文件保存到 `docs/` 文件夹
2. 文档使用 Markdown 格式
3. 文档内容使用中文
4. **会话总结规则**：
   - 当用户说 **"总结并保存此次会话的内容，以及当前项目进度"** 时，执行以下操作：
     - 将本次对话内容整理分析归档
     - 保存为 `docs/SESSION_SUMMARY_YYYYMMDD_HHMMSS.md`（当前时间戳）
     - 更新 `docs/CHANGELOG.md` 项目进展记录文件，然后提交`docs/CHANGELOG.md` 到github
   - 每次打开项目时，从 `docs/` 文件夹中读取**最新的** `SESSION_SUMMARY_*.md` 文件，以便无缝衔接上次对话
5. **项目进展记录**：
   - 维护唯一的 `docs/CHANGELOG.md` 文件
   - 记录每次会话的主要更新内容
   - 格式：日期 + 更新摘要 + 详细内容

### 交流规范
1. 使用中文进行交流
2. 技术术语可保留英文原文
3. 代码注释使用中文

### Git 工作流
1. 主分支：`main`
2. 提交信息使用中文
3. 提交前确保代码可正常运行
4. Git 代理配置：`http://127.0.0.1:7890`
5. **代码提交流程**：
   - 修改代码后**不要自动提交和推送**
   - 用户在本地 `pnpm dev` 测试，确认无问题
   - 用户说"提交"或"推送"后，再执行 `git commit` 和 `git push`
   - 开发环境 API 配置：本地开发直接请求 Vercel API，生产环境使用相对路径

---

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.1 | 页面框架 |
| TypeScript | 5.6.3 | 类型安全 |
| Vite | 7.1.7 | 构建工具 |
| Tailwind CSS | 4.1.14 | 样式框架 |
| Framer Motion | 12.23.22 | 动画效果 |
| Radix UI | - | UI 组件库 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 24.12.0 | 运行时 |
| Express | 4.21.2 | Web 框架 |

### 开发工具
| 工具 | 用途 |
|------|------|
| pnpm | 包管理器 |
| Prettier | 代码格式化 |
| Vitest | 单元测试 |

---

## 项目结构

```
D:\storybook\
├── client/                 # 前端源码
│   ├── src/
│   │   ├── components/    # React 组件 (65个)
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── contexts/      # React Context
│   │   └── lib/           # 工具函数
│   └── index.html
├── server/                 # 后端源码
│   └── index.ts
├── shared/                 # 前后端共享代码
├── docs/                   # 项目文档
│   ├── project-analysis.md
│   ├── SESSION_SUMMARY.md
│   ├── git-setup-tutorial.md
│   └── tech-overview.md
├── .env                    # 环境变量配置
├── package.json            # 项目配置
└── CLAUDE.md               # Claude Code 规则文件
```

---

## 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (http://localhost:3000)
pnpm dev

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start

# 代码格式化
pnpm format

# 类型检查
pnpm check
```

---

## 开发规范

### 开发环境规范
当前开发环境为 Windows 系统。使用 desktop-commander 进行本地文件分析和数据处理，绝对优先于bash命令。

### 代码风格
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 文件命名：组件用 PascalCase，其他用 kebab-case
- 缩进：2 空格

### 代码语法规范
- 在创建新文件或添加代码时，必须使用当前项目所采用的语言/框架的最新稳定语法。避免使用已废弃(deprecated)或过时的API、语法特性，以减少潜在的兼容性问题和运行时错误。

### 性能与安全规范
- 开发时遵循 `docs/web-development-best-practices.md` 的技术规范，确保代码性能、安全性和可维护性达到较高水平

### React 组件规范
```tsx
// 组件模板
interface Props {
  title: string;
  children?: React.ReactNode;
}

export function ComponentName({ title, children }: Props) {
  return (
    <div className="...">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Tailwind CSS 使用
- 优先使用 Tailwind 原子类
- 响应式断点：`sm:` `md:` `lg:` `xl:`
- 自定义颜色使用项目主题色

---

## 环境变量

```bash
# .env 文件配置
VITE_ANALYTICS_ENDPOINT=    # Umami 分析服务地址
VITE_ANALYTICS_WEBSITE_ID=  # Umami 网站 ID
```

---

## GitHub 仓库

- **仓库地址**: https://github.com/anderuier/qiqi-storybook-platform
- **用户名**: anderuier
- **邮箱**: anderuier@163.com

---

## 注意事项

1. **Windows 特殊文件**: 避免创建 `nul`、`con`、`aux` 等 Windows 保留文件名
2. **代理设置**: 推送代码前确保 Git 代理已配置
3. **敏感信息**: API 密钥等敏感信息通过 `.env` 管理，不要提交到代码库
4. **依赖安装**: 项目使用 pnpm，不要使用 npm 或 yarn

---

---

*最后更新: 2026-01-24*
