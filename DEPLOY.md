# 部署指南

本文档提供了如何将稳定币记账系统部署到 Vercel 的详细步骤。

## 准备工作

在部署之前，请确保：

1. 您已有 Vercel 账户（如果没有，请在 [vercel.com](https://vercel.com) 注册）
2. 您已有 Alchemy API 密钥（用于获取 Solana 上的交易数据）
3. 您的代码已推送到 GitHub 存储库

## 方法一：使用 Vercel 网站部署

这是最简单的方法，适合不熟悉命令行的用户。

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 "Add New" > "Project"
3. 导入您的 GitHub 存储库
4. 配置项目:
   - 框架预设: Next.js
   - 根目录: ./
   - 构建命令: `CI=false next build --no-lint`
   - 输出目录: .next
5. 添加环境变量:
   - `NEXT_PUBLIC_ALCHEMY_API_KEY`: 您的 Alchemy API 密钥
   - `NEXT_PUBLIC_ENABLE_LOGS`: 设置为 `false`
   - `NEXT_PUBLIC_ENABLE_DEBUG`: 设置为 `false`
   - `NEXT_PUBLIC_DISABLE_WARNINGS`: 设置为 `false`
6. 点击 "Deploy"

## 方法二：使用 Vercel CLI 部署

这种方式适合有命令行经验的开发者，更快捷灵活。

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 从项目目录登录 Vercel

```bash
vercel login
```

按照提示完成登录过程。

### 3. 部署项目

```bash
# 基本部署
vercel

# 或使用环境变量部署
vercel -e NEXT_PUBLIC_ALCHEMY_API_KEY=你的密钥 -e NEXT_PUBLIC_ENABLE_LOGS=false -e NEXT_PUBLIC_ENABLE_DEBUG=false -e NEXT_PUBLIC_DISABLE_WARNINGS=false
```

### 4. 部署到生产环境

开发完成后，将项目部署到生产环境：

```bash
vercel --prod
```

## 故障排除

如果您在部署过程中遇到问题：

1. **构建错误**:
   - 使用 `CI=false` 和 `--no-lint` 标志跳过严格检查
   - 确保在 next.config.ts 中已启用 `ignoreBuildErrors` 和 `ignoreDuringBuilds` 选项

2. **钱包连接错误**:
   - 在开发环境测试项目
   - 确保已正确配置 RainbowKit 和 wagmi

3. **API 错误**:
   - 确认 Alchemy API 密钥是否正确设置
   - 验证 API 密钥是否有权访问 Solana 网络

## 更新已部署的项目

每次代码更改后，您可以使用以下命令重新部署：

```bash
# 先提交更改到 GitHub
git add .
git commit -m "修改说明"
git push

# 然后重新部署
vercel --prod
```

## 自定义域名

项目部署成功后，您可以为其添加自定义域名：

1. 在 Vercel 仪表板中，选择您的项目
2. 点击 "Settings" > "Domains"
3. 添加您的域名并按照指示完成 DNS 配置

## 环境变量详解

- `NEXT_PUBLIC_ALCHEMY_API_KEY`: 用于访问 Solana 区块链数据的 API 密钥
- `NEXT_PUBLIC_ENABLE_LOGS`: 控制是否在浏览器控制台显示普通日志信息
- `NEXT_PUBLIC_ENABLE_DEBUG`: 控制是否在浏览器控制台显示详细调试信息
- `NEXT_PUBLIC_DISABLE_WARNINGS`: 控制是否在浏览器控制台显示警告信息 