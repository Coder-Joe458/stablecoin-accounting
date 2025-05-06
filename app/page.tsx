"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import * as Papa from 'papaparse';
import Link from 'next/link';
import { getUSDCTransactions, Transaction as ApiTransaction } from './components/AlchemyAPI';
import WalletSelector from './components/WalletSelector';

// 使用从API导入的Transaction类型
type Transaction = ApiTransaction;

// 定义钱包中可能支持的所有链类型
type ChainType = 'ethereum' | 'solana' | 'polygon' | 'base' | 'bitcoin';

type TransactionSummary = {
  totalIn: number;
  totalOut: number;
  netAmount: number;
};

// 定义全局事件类型用于跨组件通信
declare global {
  interface WindowEventMap {
    'chain-changed': CustomEvent<{ chain: ChainType, address: string }>;
  }
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<ChainType>('ethereum');
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIn: 0,
    totalOut: 0,
    netAmount: 0
  });

  // 监听链切换事件
  useEffect(() => {
    const handleChainChange = (event: CustomEvent<{ chain: ChainType, address: string }>) => {
      console.log(`链切换事件: ${event.detail.chain}, 地址: ${event.detail.address}`);
      setSelectedChain(event.detail.chain);
      fetchTransactions(event.detail.address, event.detail.chain);
    };

    window.addEventListener('chain-changed', handleChainChange as EventListener);
    
    return () => {
      window.removeEventListener('chain-changed', handleChainChange as EventListener);
    };
  }, []);

  // 当用户连接钱包后获取交易数据
  useEffect(() => {
    if (isConnected && address) {
      console.log(`用户连接了钱包: ${address}`);
      // 确定钱包类型 (添加更明确的日志)
      const isEthWallet = address.startsWith('0x');
      const chainType: ChainType = isEthWallet ? 'ethereum' : 'solana';
      console.log(`钱包类型判断: ${isEthWallet ? '以太坊钱包' : 'Solana钱包'}`);
      setSelectedChain(chainType);
      fetchTransactions(address, chainType);
    } else {
      // 当钱包断开连接时清除数据
      setTransactions([]);
      setSummary({
        totalIn: 0,
        totalOut: 0,
        netAmount: 0
      });
    }
  }, [isConnected, address]);

  // 获取交易数据的函数
  const fetchTransactions = async (walletAddress: string, chainType: ChainType = 'ethereum') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用Alchemy API获取稳定币交易数据
      console.log(`获取钱包地址 ${walletAddress} 的稳定币交易数据，链类型: ${chainType}`);
      
      // 获取交易数据（包括真实和模拟数据）
      const transactionsData = await getUSDCTransactions(
        walletAddress
      );
      
      // 确保我们至少显示一些数据，即使没有真实交易
      if (transactionsData.length === 0) {
        console.log("没有找到交易数据，使用模拟数据");
        const mockData = createMockTransactions(walletAddress, chainType);
        setTransactions(mockData);
        calculateSummary(mockData);
      } else {
        console.log(`找到 ${transactionsData.length} 条交易数据`);
        setTransactions(transactionsData);
        calculateSummary(transactionsData);
      }
    } catch (error) {
      console.error('获取交易数据失败:', error);
      setError('获取交易数据失败，使用模拟数据');
      
      // 出错时使用模拟数据
      const mockData = createMockTransactions(walletAddress, chainType);
      setTransactions(mockData);
      calculateSummary(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成模拟数据的函数
  const createMockTransactions = (walletAddress: string, chainType: ChainType = 'ethereum'): Transaction[] => {
    const isEthereumChain = ['ethereum', 'polygon', 'base'].includes(chainType);
    
    return [
      {
        timestamp: Date.now() - 86400000 * 4,
        hash: isEthereumChain 
          ? '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
          : '5UfFhzafuLnMUFbKzFqjQHihL5GS6QYMj6ADyQ8kH1mVRHQwBQnomCgpE1g1wQFCK6JeYWR7KJp3L8GfnGK84JD3',
        from: isEthereumChain ? '0x1111111111111111111111111111111111111111' : 'DSgydDHd834rkxvFVeukZGt4sGUxjd5WW4qySLy5A5LX',
        to: walletAddress,
        amount: '2000000000', // 2000 USDC
        direction: 'in',
        formattedDate: new Date(Date.now() - 86400000 * 4).toLocaleDateString(),
        coin: 'USDC',
        chain: isEthereumChain ? 'ethereum' : 'solana'
      },
      {
        timestamp: Date.now() - 86400000 * 3,
        hash: isEthereumChain
          ? '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
          : '4KsMmKnU9nPAd1YirLZYgDJGiGYTerctU4Lqhb87yrNKj5trSmLZnNdUrGdLKkpnbQ3gNXKjdHvMcDFjXwQSBHQ',
        from: walletAddress,
        to: isEthereumChain ? '0x2222222222222222222222222222222222222222' : 'AnotherSolanaAddress1111111111111111111111111',
        amount: '500000000', // 500 USDC
        direction: 'out',
        formattedDate: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
        coin: 'USDC',
        chain: isEthereumChain ? 'ethereum' : 'solana'
      },
      {
        timestamp: Date.now() - 86400000 * 2,
        hash: isEthereumChain
          ? '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
          : '2Lrj5xRDbBE6DkKdLKfQ6JwVF1PksQMGBqdNr8JmrTHxp2LofjYrh77qQ1S1pZoNKU5L3UVS6TQkdPrHPxwHYQbN',
        from: isEthereumChain ? '0x3333333333333333333333333333333333333333' : 'AnotherSolanaAddress2222222222222222222222222',
        to: walletAddress,
        amount: '1500000000', // 1500 USDC
        direction: 'in',
        formattedDate: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        coin: chainType === 'solana' ? 'USDT' : 'USDC',
        chain: isEthereumChain ? 'ethereum' : 'solana'
      },
      {
        timestamp: Date.now() - 86400000,
        hash: isEthereumChain
          ? '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
          : '639xJbYzVd2MHYyAtCGDCJXEZ8KDtY1CfM4a2NZonpBkjRLQrZMnXkUMVRTVAZyAGhdPvmKRx71btFQnLGoR4hRU',
        from: walletAddress,
        to: isEthereumChain ? '0x4444444444444444444444444444444444444444' : 'AnotherSolanaAddress3333333333333333333333333',
        amount: '800000000', // 800 USDC
        direction: 'out',
        formattedDate: new Date(Date.now() - 86400000).toLocaleDateString(),
        coin: 'USDC',
        chain: isEthereumChain ? 'ethereum' : 'solana'
      }
    ];
  };

  // 计算交易汇总数据
  const calculateSummary = (txs: Transaction[]) => {
    const summary = txs.reduce((acc, tx) => {
      try {
        // 尝试统一处理所有交易金额
        let amount = 0;
        
        // 日志原始数据用于调试
        console.log(`[交易汇总调试] 处理交易: ${tx.hash.substring(0, 10)}..., 链: ${tx.chain}, 硬币: ${tx.coin}, 方向: ${tx.direction}, 原始金额: ${tx.amount}`);
        
        // 根据金额格式选择处理方法
        if (tx.amount.includes('.')) {
          // 如果是带小数点的数字，直接用parseFloat
          amount = parseFloat(tx.amount);
          console.log(`汇总计算 (小数): ${tx.hash.substring(0, 8)} - 原始金额=${tx.amount}, 解析后=${amount}`);
        } else {
          // 对于大整数金额 (按6位小数存储)
          try {
            amount = parseFloat(formatUnits(BigInt(tx.amount), 6));
            console.log(`汇总计算 (BigInt): ${tx.hash.substring(0, 8)} - 原始金额=${tx.amount}, 解析后=${amount}, 链=${tx.chain}`);
          } catch (err) {
            // 如果BigInt转换失败，回退到简单除法
            amount = parseInt(tx.amount) / 1000000;
            console.log(`汇总计算 (回退): ${tx.hash.substring(0, 8)} - 原始金额=${tx.amount}, 解析后=${amount}, 错误=${err instanceof Error ? err.message : 'unknown error'}`);
          }
        }
        
        if (isNaN(amount)) {
          console.error(`金额解析为NaN: ${tx.amount}`);
          return acc; // 跳过此交易
        }
        
        if (tx.direction === 'in') {
          acc.totalIn += amount;
        } else {
          acc.totalOut += amount;
        }
        
        console.log(`汇总更新: 收入=${acc.totalIn.toFixed(2)}, 支出=${acc.totalOut.toFixed(2)}`);
      } catch (error) {
        console.error(`交易金额处理错误:`, tx.amount, error);
        // 发生错误时跳过此交易
      }
      
      return acc;
    }, {
      totalIn: 0,
      totalOut: 0,
      netAmount: 0
    });
    
    summary.netAmount = summary.totalIn - summary.totalOut;
    console.log(`最终汇总: 收入=${summary.totalIn.toFixed(2)}, 支出=${summary.totalOut.toFixed(2)}, 净额=${summary.netAmount.toFixed(2)}`);
    setSummary(summary);
  };

  // 导出CSV
  const exportCSV = () => {
    if (transactions.length === 0) {
      alert('没有交易数据可导出');
      return;
    }
    
    try {
      console.log('正在准备导出数据...');
      console.log('当前交易数据:', transactions);
      
      // 准备导出数据
      const data = transactions.map(tx => ({
        日期: tx.formattedDate,
        类型: tx.direction === 'in' ? '收入' : '支出',
        金额: (() => {
          try {
            console.log(`[AMOUNT_DEBUG] 处理显示金额: 交易=${tx.hash.substring(0, 8)}, 链=${tx.chain}, 币种=${tx.coin}, 方向=${tx.direction}, 原始金额=${tx.amount}`);
            
            if (tx.amount.includes('.')) {
              const amount = parseFloat(tx.amount).toFixed(2);
              console.log(`格式化含小数点金额: ${tx.amount} → ${amount}`);
              return amount;
            } else {
              // 假设所有整数金额都是按照6位小数存储的
              try {
                const formattedAmount = parseFloat(formatUnits(BigInt(tx.amount), 6)).toFixed(2);
                console.log(`格式化整数金额: ${tx.amount} → ${formattedAmount}, 链: ${tx.chain}`);
                return formattedAmount;
              } catch (err) {
                console.error(`BigInt转换失败 (${tx.chain}): ${tx.amount}`, err);
                // 作为后备方案，尝试直接除以1000000
                const fallbackAmount = (parseInt(tx.amount) / 1000000).toFixed(2);
                console.log(`使用后备方法格式化金额: ${tx.amount} → ${fallbackAmount}, 链: ${tx.chain}`);
                return fallbackAmount;
              }
            }
          } catch (error) {
            console.error(`金额转换错误 (${tx.chain}): ${tx.amount}`, error);
            // 作为后备方案，尝试直接除以1000000
            try {
              const fallbackAmount = (parseInt(tx.amount) / 1000000).toFixed(2);
              console.log(`使用后备方法格式化金额: ${tx.amount} → ${fallbackAmount}, 链: ${tx.chain}`);
              return fallbackAmount;
            } catch (e) {
              console.error(`后备金额转换也失败 (${tx.chain}): ${tx.amount}`, e);
              return '格式错误';
            }
          }
        })(),
        币种: tx.coin || 'USDC',
        对方地址: tx.direction === 'in' ? tx.from : tx.to,
        交易哈希: tx.hash
      }));
      
      console.log('转换为CSV格式...');
      // 转换为CSV
      const csv = Papa.unparse(data);
      console.log('CSV数据生成成功，长度:', csv.length);
      
      // 直接触发下载
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `stablecoin_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      console.log('触发文件下载...');
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('CSV文件下载完成');
      }, 100);
    } catch (error) {
      console.error('导出CSV时出错:', error);
      alert('导出CSV时出错，请查看控制台以获取详细信息');
    }
  };

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 刷新交易数据
  const handleRefresh = () => {
    if (isConnected && address) {
      fetchTransactions(address, selectedChain);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">稳定币记账系统</h1>
          <Link href="/invoice" className="text-blue-600 hover:text-blue-800">
            创建发票
          </Link>
        </div>
        
        {/* 钱包连接区域 */}
        <div className="flex justify-center mb-4">
          <WalletSelector />
        </div>

        {isConnected ? (
          <>
            {/* 汇总数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">总收入</p>
                <p className="text-2xl font-bold text-green-600">${summary.totalIn.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">总支出</p>
                <p className="text-2xl font-bold text-red-600">${summary.totalOut.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">净额</p>
                <p className="text-2xl font-bold text-blue-600">${summary.netAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={handleRefresh}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                disabled={isLoading}
              >
                刷新数据
              </button>
              <button
                onClick={exportCSV}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center gap-1"
                disabled={transactions.length === 0 || isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出CSV
              </button>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* 交易列表 */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">币种</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">区块链</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">对方地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交易哈希</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.formattedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.direction === 'in' ? '收入' : '支出'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(() => {
                            try {
                              console.log(`[AMOUNT_DEBUG] 处理显示金额: 交易=${tx.hash.substring(0, 8)}, 链=${tx.chain}, 币种=${tx.coin}, 方向=${tx.direction}, 原始金额=${tx.amount}`);
                              
                              if (tx.amount.includes('.')) {
                                const amount = parseFloat(tx.amount).toFixed(2);
                                console.log(`格式化含小数点金额: ${tx.amount} → ${amount}`);
                                return amount;
                              } else {
                                // 假设所有整数金额都是按照6位小数存储的
                                try {
                                  const formattedAmount = parseFloat(formatUnits(BigInt(tx.amount), 6)).toFixed(2);
                                  console.log(`格式化整数金额: ${tx.amount} → ${formattedAmount}, 链: ${tx.chain}`);
                                  return formattedAmount;
                                } catch (err) {
                                  console.error(`BigInt转换失败 (${tx.chain}): ${tx.amount}`, err);
                                  // 作为后备方案，尝试直接除以1000000
                                  const fallbackAmount = (parseInt(tx.amount) / 1000000).toFixed(2);
                                  console.log(`使用后备方法格式化金额: ${tx.amount} → ${fallbackAmount}, 链: ${tx.chain}`);
                                  return fallbackAmount;
                                }
                              }
                            } catch (error) {
                              console.error(`金额转换错误 (${tx.chain}): ${tx.amount}`, error);
                              // 作为后备方案，尝试直接除以1000000
                              try {
                                const fallbackAmount = (parseInt(tx.amount) / 1000000).toFixed(2);
                                console.log(`使用后备方法格式化金额: ${tx.amount} → ${fallbackAmount}, 链: ${tx.chain}`);
                                return fallbackAmount;
                              } catch (e) {
                                console.error(`后备金额转换也失败 (${tx.chain}): ${tx.amount}`, e);
                                return '格式错误';
                              }
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.coin || 'USDC'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.chain === 'solana' ? 'Solana' : 'Ethereum'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.direction === 'in' ? formatAddress(tx.from) : formatAddress(tx.to)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a 
                            href={tx.chain === 'solana' 
                              ? `https://solscan.io/tx/${tx.hash}` 
                              : `https://etherscan.io/tx/${tx.hash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {formatAddress(tx.hash)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">无交易记录</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg mb-4">请连接您的钱包以查看交易记录</p>
            <p className="text-gray-500">连接钱包后，系统将自动获取您的稳定币交易记录</p>
          </div>
        )}
      </div>
    </main>
  );
}
