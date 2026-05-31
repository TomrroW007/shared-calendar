# ADR-0002: Vercel 部署环境下的鉴权与实时通信架构重构 (Auth & Real-time Overhaul for Vercel)

* **状态**: 已接受 (Accepted)
* **日期**: 2026-05-31
* **决策人**: Antigravity, robin

## 1. 背景上下文 (Context)

应用先前设计在向 Vercel (Serverless) 部署和多人并发协作时遇到了以下技术阻碍：

1. **安全性不足 (Security)**：用户注册仅需昵称，登录凭证为数据库中明文保存的
   UUID Token，极易遭受泄露和 XSS（跨站脚本攻击）盗取。
2. **Serverless SSE 不可行 (Real-time)**：先前的实时通知基于原生的
   Server-Sent Events (SSE)，将客户端连接维持在 Node.js 进程内存的 Map 中。
   在 Vercel 这种 Serverless 无状态容器中：
   * 实例会横向动态扩缩容，各个孤立的实例无法共享内存中的连接 Map；
   * Vercel 存在 10s-30s 的硬性函数超时限制，长连接会被不断强制切断，导致
     通知机制彻底瘫痪。

## 2. 决策决定 (Decision)

为了使应用完全具备生产环境的安全性，并能无缝在 Vercel Serverless
环境运行，我们做出以下架构重构决策：

### 2.1 用户鉴权升级

* **移除 UUID Token**：更改为用户名 (username) + 密码 (password) +
  昵称 (nickname) 模式。
* **加盐密码哈希**：密码落库前使用 `bcryptjs`（10 轮加盐）强哈希加密。
* **JWT Cookie 载体**：生成 JSON Web Token (JWT) 会话令牌，并通过
  `HttpOnly`、`Secure`、`SameSite=Lax` 的安全 Cookie 写入浏览器。JavaScript
  脚本无法读取该 Cookie，从而免疫 XSS 攻击。
* **全局路由守卫 (Middleware)**：在根目录实现 Next.js Edge Middleware
  ([middleware.js][middleware-url])，全局拦截非法请求，对 JWT 解密验证，并将解密出的
  `x-user-id` 注入下游 API 的 Request Headers，移除所有 API 接口中重复鉴权的
  繁琐代码 (DRY)。

### 2.2 实时通信重构

* **引入 Pusher Channels**：弃用原生的 SSE 长连接，改用托管的 Pusher
  WebSockets 实时网关服务（提供免费额度：100 并发，20 万消息/天）。
* **私有通道机制**：
  * 每个用户监听 `private-user-${userId}` 通道接收系统通知。
  * 每个空间监听 `private-space-${spaceId}` 通道接收日程与提案的实时变动。
* **网关授权接口**：设计了保护接口 `/api/pusher/auth`，只允许经验证的对应用户和
  空间成员加入上述私有通道，保障日历隐私。

## 3. 产生后果 (Consequences)

* **正面效益 (Positive)**：
  * 应用 100% 适配 Vercel 的 Serverless Functions 部署。
  * 彻底解决了 Serverless 下无法维持长连接和实例连接不共享的问题。
  * 极大地增强了用户隐私安全性（哈希加密、XSS 物理防御、私有推送通道校验）。
  * 大幅精简了下游 API 路由文件（移除 14 个 API 文件中的冗余 `authenticate`
    代码）。
* **负面效益/开销 (Negative)**：
  * 部署和本地开发时需要额外配置 Pusher API Keys 环境变量。
  * 前端 Fetch 接口需在 Edge Runtime 运行时引入 `jose` 库进行解析。

[middleware-url]: file:///Users/robin/Desktop/shared-calendar/middleware.js
