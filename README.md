# 稳定币记账系统

一个简单易用的稳定币交易记录管理系统，当前支持Solana上的USDC。

## 功能特点

- 连接Solana钱包查看USDC交易记录
- 查看交易统计信息（收入、支出、净额）
- 生成交易PDF发票
- 支持中英文双语界面
- 响应式设计，适配移动端和桌面端

## 开发环境

- Node.js 16+
- Next.js 15
- RainbowKit 钱包连接
- TailwindCSS 样式
- TypeScript

## 本地开发

1. 克隆代码库

```bash
git clone https://github.com/yourusername/stablecoin-accounting.git
cd stablecoin-accounting
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run dev
```

4. 打开浏览器访问 http://localhost:3000

## 生产环境构建

```bash
npm run build
npm start
```

## 部署到 Vercel

本项目可以轻松部署到 Vercel 平台：

1. 将项目推送到 GitHub 代码库
2. 在 Vercel 中导入该项目
3. 设置以下环境变量：
   - `NEXT_PUBLIC_ALCHEMY_API_KEY`: 您的 Alchemy API 密钥
   - `NEXT_PUBLIC_ENABLE_LOGS`: 设置为 `false` 禁用日志
   - `NEXT_PUBLIC_ENABLE_DEBUG`: 设置为 `false` 禁用调试日志
   - `NEXT_PUBLIC_DISABLE_WARNINGS`: 设置为 `false` 允许警告

4. 部署！

或者使用 Vercel CLI 进行部署：

```bash
npm install -g vercel
vercel login
vercel
```

## 配置说明

- 日志配置: 在生产环境中，日志默认被禁用。如需启用，请设置环境变量 `NEXT_PUBLIC_ENABLE_LOGS=true`
- API密钥: 在部署时需要设置 `NEXT_PUBLIC_ALCHEMY_API_KEY` 环境变量
- 国际化: 支持英文(en)和中文(zh)，默认根据浏览器语言自动选择

## 技术栈

- Next.js
- TypeScript
- TailwindCSS
- wagmi + RainbowKit (钱包连接)
- Alchemy API (区块链数据)

## 使用指南

1. 打开应用，连接您的以太坊钱包
2. 系统会自动获取钱包中的USDC交易记录
3. 查看交易列表和收支汇总
4. 使用"导出CSV"按钮导出交易数据
5. 点击"创建发票"可以生成简易发票

## 后续计划

- 支持多链 (Polygon, Arbitrum, Optimism等)
- 支持多种稳定币 (USDT, DAI等)
- 自动分类 (收入来源分类)
- 自动生成月度/季度财务报表
- 连接传统会计系统

## 许可证

MIT
