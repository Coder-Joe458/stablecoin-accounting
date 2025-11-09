# Stablecoin Accounting System

A simple and user-friendly stablecoin transaction management system, currently supporting USDC on Solana.

## Features

- Connect Solana wallet to view USDC transaction history
- View transaction statistics (income, expenses, net balance)
- Generate transaction PDF invoices
- Bilingual interface support (English/Chinese)
- Responsive design for mobile and desktop

## Development Environment

- Node.js 16+
- Next.js 15
- RainbowKit wallet connection
- TailwindCSS styling
- TypeScript

## Local Development

1. Clone the repository

```bash
git clone https://github.com/yourusername/stablecoin-accounting.git
cd stablecoin-accounting
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open your browser and visit http://localhost:3000

## Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel

This project can be easily deployed to Vercel:

1. Push the project to a GitHub repository
2. Import the project in Vercel
3. Set the following environment variables:
   - `NEXT_PUBLIC_ALCHEMY_API_KEY`: Your Alchemy API key
   - `NEXT_PUBLIC_ENABLE_LOGS`: Set to `false` to disable logs
   - `NEXT_PUBLIC_ENABLE_DEBUG`: Set to `false` to disable debug logs
   - `NEXT_PUBLIC_DISABLE_WARNINGS`: Set to `false` to allow warnings

4. Deploy!

Or deploy using Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel
```

## Configuration

- Logging: In production, logging is disabled by default. To enable, set the environment variable `NEXT_PUBLIC_ENABLE_LOGS=true`
- API Key: Set the `NEXT_PUBLIC_ALCHEMY_API_KEY` environment variable when deploying
- Internationalization: Supports English (en) and Chinese (zh), automatically selected based on browser language

## Tech Stack

- Next.js
- TypeScript
- TailwindCSS
- wagmi + RainbowKit (wallet connection)
- Alchemy API (blockchain data)

## Usage Guide

1. Open the application and connect your Ethereum wallet
2. The system will automatically fetch USDC transaction records from your wallet
3. View transaction list and income/expense summary
4. Use the "Export CSV" button to export transaction data
5. Click "Create Invoice" to generate a simple invoice

## Future Plans

- Multi-chain support (Polygon, Arbitrum, Optimism, etc.)
- Support for multiple stablecoins (USDT, DAI, etc.)
- Automatic categorization (income source classification)
- Auto-generate monthly/quarterly financial reports
- Integration with traditional accounting systems

## License

MIT
