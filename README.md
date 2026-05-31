# Shared Calendar (共享日历) 🗓️

一款基于 **Next.js** 和 **MongoDB** 构建的朋友间可用性同步工具。轻松标记你的空闲、忙碌或休假状态，与好友实时查看彼此的时间安排，快速发起活动投票。本应用使用 [Vercel](https://vercel.com/) 托管前端和 API，并使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 作为数据库服务。

## ✨ 功能特性

- **🔐 安全鉴权**: 采用主流密码学加密注册与登录体系，结合 `HttpOnly` 的 Secure JWT Cookie 与 Next.js Edge Middleware 进行全局守护。
- **📅 状态同步**: 标记每日状态（✅ 可约、💼 忙碌、🏖️ 休假、❓ 待定）。
- **👥 空间管理**: 创建专属空间，邀请朋友加入（通过邀请码）。
- **🔔 实时通知**: 基于 **Pusher Channels WebSockets** 实现的实时无延迟通知与日程同步，100% 兼容 Serverless (Vercel) 环境。
- **🎯 活动提案**: 发起活动投票，协作选出大家都有空的日期。
- **📱 移动端适配**: 专为移动端优化的响应式流体界面。

## 🛠️ 技术栈 (Tech Stack)

本项目采用现代主流 Web 技术构建：

- **框架**: [Next.js 15.5](https://nextjs.org/) (App Router) & React 19。
- **语言**: JavaScript (ES6+)。
- **数据库**: [MongoDB](https://www.mongodb.com/) (配合 [Mongoose](https://mongoosejs.com/) ORM)。
- **安全与鉴权**: `bcryptjs` (密码哈希加密), `jsonwebtoken` & `jose` (Edge 校验 JWT Cookie)。
- **实时消息网关**: [Pusher Channels SDK](https://pusher.com/channels) (Serverless WebSockets)。
- **样式**: Native CSS (采用 Fluid Design 响应式设计系统)。
- **部署**: [Vercel](https://vercel.com/) (Serverless Architecture)。

## 🚀 快速开始 (Getting Started)

### 前置要求

- Node.js 18+
- MongoDB 数据库 

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd shared-calendar
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制示例环境配置文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的配置参数（包括 MongoDB 连接字符串、JWT_SECRET、以及 Pusher App Keys 等）：

```env
MONGODB_URI=mongodb://localhost:27017/shared-calendar
JWT_SECRET=your_jwt_secret_key
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

### 4. 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 📦 部署 (Deployment)

推荐使用 **Vercel** 进行部署，这是 Next.js 的官方部署平台。

1.  将代码推送到 GitHub。
2.  在 Vercel 中导入项目。
3.  在 Project Settings -> Environment Variables 中添加 `MONGODB_URI`。
4.  点击 Deploy。

详细部署指南请参考 [deployment_guide.md](./deployment_guide.md)。

## 📂 项目结构

```
.
├── app/                 # Next.js App Router 路由和页面
│   ├── api/             # 后端 API 接口 (Serverless Functions)
│   ├── space/           # 空间详情页
│   └── ...
├── components/          # React UI 组件
├── lib/                 # 工具函数 (如数据库连接)
├── models/              # Mongoose 数据模型 (Schema)
└── public/              # 静态资源
```

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！

## 📄 许可证

MIT License
