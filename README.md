# 小麻雀（xiaomaque）

小麻雀是一款面向短剧与视频创作的 AI 辅助平台。用户可以从创意灵感出发，借助大语言模型生成剧本摘要与分集脚本，在可视化画布中管理角色、场景等资产，并通过分镜编辑与 AI 生图、生视频能力，完成从策划到成片的全流程创作。

---

## 功能概览

### 创作入口

- **首页**：创意输入与 Agent 智能路由，根据描述自动匹配最合适的 AI 能力
- **短剧 Agent**：剧本 AI 生成面板、最近项目列表与项目管理

### 短剧项目工作流

每个项目按步骤推进，典型流程为：

1. **剧情大纲** — 将原始创意转为结构化剧本摘要（集数、人物小传、故事梗概等）
2. **资产库** — 管理角色、场景、道具、素材等项目资产
3. **分集视频** — 创建分集、编辑分镜脚本、调用 AI 生成视频

### 分集分镜编辑

- 分镜片段的增删、排序与脚本文案编辑
- 支持 `@资产` 引用与时长标记
- 集成火山方舟 Seedream 生图、Seedance 生视频

### 自由画布（可用，但还在优化中）

- 基于 React Flow 的无限画布工作区
- 支持图片、视频、音频、文本等多媒体节点
- 可从资产库选取素材，支持本地上传

### 全局资产库

- 跨项目复用角色、场景、道具等资产
- 支持分类筛选与媒体管理

### AI Agent 能力

| Agent | 说明 |
|-------|------|
| 剧本摘要 | 将创意/大纲转为结构化剧本摘要，供立项与编剧使用 |
| 分集剧本 | 结合摘要生成分集大纲，并逐集输出符合影视格式的分集正文 |

Agent 基于 **LangChain** 实现

---

## 技术栈

### 前端（`packages/client`）

| 类别 | 技术 |
|------|------|
| 框架 | React 19、TypeScript、Vite |
| 路由 | React Router v7 |
| 状态 | Redux Toolkit |
| UI | Tailwind CSS 4、shadcn/ui、Radix UI |
| 画布 | React Flow（@xyflow/react） |
| 其他 | Axios、wavesurfer.js、TanStack Virtual |

### 后端（`packages/serve`）

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js、Express |
| 数据库 | MySQL + Prisma ORM |
| AI | LangChain、OpenAI 兼容接口 |
| 校验 | Zod |
| 存储 | 七牛云对象存储 |
| 生成 | 火山方舟 Seedream（图片）、Seedance（视频） |

---

## 项目结构

```
xiaomaque/
├── packages/
│   ├── client/                 # 前端应用
│   │   └── src/
│   │       ├── api/            # HTTP 接口封装
│   │       ├── components/     # UI 组件
│   │       ├── hooks/          # 可复用 Hooks
│   │       ├── layouts/        # 布局
│   │       ├── lib/            # 工具函数
│   │       ├── pages/          # 页面
│   │       ├── router/         # 路由配置
│   │       └── store/          # Redux 状态
│   └── serve/                  # 后端服务
│       ├── prisma/             # 数据库 Schema 与迁移
│       └── src/
│           ├── agents/         # AI Agent 实现
│           ├── controllers/    # HTTP 控制器（约定式路由）
│           ├── middleware/     # 中间件
│           ├── routes/         # 路由汇总
│           ├── services/       # 业务逻辑
│           └── validators/     # 请求校验
├── package.json
└── pnpm-workspace.yaml
```

---

## 环境要求

- **Node.js** ≥ 18
- **pnpm** ≥ 8
- **MySQL** 8.x

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置后端环境变量

复制示例文件并填写实际配置：

```bash
cp packages/serve/.env.development.example packages/serve/.env.development
```

主要配置项说明：

| 变量 | 说明 |
|------|------|
| `PORT` | 后端监听端口，默认 `3000`|
| `DATABASE_URL` | MySQL 连接字符串 |
| `JWT_SECRET` | JWT 签名密钥 |
| `OPENAI_API_KEY` | OpenAI 兼容 API Key（LangChain / Agent 使用） |
| `OPENAI_BASE_URL` | 可选，兼容 API 的 Base URL |
| `ARK_API_KEY` | 火山方舟 API Key（生图 / 生视频） |
| `QINIU_*` | 七牛云存储与 CDN 配置 |
| `CORS_ORIGIN` | 允许跨域的前端地址 |
| `API_SIGN_SECRET` | 前后端请求签名密钥，需与前端保持一致 |

### 3. 初始化数据库

```bash
cd packages/serve
pnpm db:push      # 将 Schema 同步到数据库
# 或使用迁移：pnpm pmd
```


### 5. 启动开发服务

在项目根目录分别启动前后端：

```bash
# 终端 1：前端（默认 http://localhost:12345）
pnpm dc

# 终端 2：后端
pnpm ds
```





---



## License

本项目采用 [MIT License](LICENSE) 开源协议。
