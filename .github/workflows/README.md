# GitHub Actions Workflows

本目录用于存放 CI/CD 自动化工作流配置。

## 📋 工作流说明

### 建议的工作流

#### 1. CI 工作流 (`ci.yml`)

- **触发条件**：每次 push 和 pull request
- **任务**：
  - 代码 lint（ESLint）
  - 格式检查（Prettier）
  - 构建测试（Next.js build）
  - 单元测试（Jest）
  - 集成测试（可选）

#### 2. 部署工作流 (`deploy.yml`)

- **触发条件**：合并到 main 分支
- **任务**：
  - 自动部署到生产环境
  - 环境变量配置
  - 健康检查

#### 3. 依赖更新 (`dependency-update.yml`)

- **触发条件**：定时（每周）
- **任务**：
  - 自动检查依赖更新
  - 创建 PR

## 📝 工作流示例

### CI 工作流示例

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
```

### 部署工作流示例

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # 添加部署脚本
          echo "Deploying to production..."
```

## 🔐 Secrets 配置

在 GitHub 仓库设置中配置以下 secrets：

- `MONGODB_URI` - MongoDB 连接字符串
- `NEXTAUTH_SECRET` - NextAuth 密钥
- `DEPLOY_TOKEN` - 部署令牌（如需要）

## 📚 参考资源

- [GitHub Actions 文档](https://docs.github.com/actions)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
