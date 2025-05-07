"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import * as Papa from 'papaparse';
import Link from 'next/link';
import { getUSDCTransactions, Transaction as ApiTransaction } from '../components/AlchemyAPI';
import WalletSelector from '../components/WalletSelector';
import { useTranslations, useLocale } from 'next-intl';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// 导入所需模块
import 'jspdf-font';
import logger from '../utils/logger';

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
  const locale = useLocale();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<ChainType>('solana');
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIn: 0,
    totalOut: 0,
    netAmount: 0
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  // 加载翻译
  const t = useTranslations();
  const tHome = useTranslations('home');
  const tWallet = useTranslations('wallet');
  const tTransaction = useTranslations('transaction');
  const tCommon = useTranslations('common');
  const tError = useTranslations('error');
  const tInvoice = useTranslations('invoice');

  // 监听链切换事件
  useEffect(() => {
    const handleChainChange = (event: CustomEvent<{ chain: ChainType, address: string }>) => {
      logger.log(`链切换事件: ${event.detail.chain}, 地址: ${event.detail.address}`);
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
      logger.log(`用户连接了钱包: ${address}`);
      // 确定钱包类型 (添加更明确的日志)
      const isEthWallet = address.startsWith('0x');
      const chainType: ChainType = isEthWallet ? 'ethereum' : 'solana';
      logger.log(`钱包类型判断: ${isEthWallet ? '以太坊钱包' : 'Solana钱包'}`);
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
  const fetchTransactions = async (walletAddress: string, chainType: ChainType = 'solana') => {
    setIsLoading(true);
    setError(null);
    
    // 如果不是 Solana 链，显示不支持的消息
    if (chainType !== 'solana') {
      setIsLoading(false);
      setError(tError('unsupportedChain'));
      setTransactions([]);
      setSummary({
        totalIn: 0,
        totalOut: 0,
        netAmount: 0
      });
      return;
    }
    
    try {
      // 使用Alchemy API获取稳定币交易数据
      logger.log(`获取钱包地址 ${walletAddress} 的稳定币交易数据，链类型: ${chainType}`);
      
      // 获取交易数据
      const transactionsData = await getUSDCTransactions(
        walletAddress
      );
      
      if (transactionsData.length === 0) {
        logger.log("没有找到交易数据");
        setTransactions([]);
        setSummary({
          totalIn: 0,
          totalOut: 0,
          netAmount: 0
        });
      } else {
        logger.log(`找到 ${transactionsData.length} 条交易数据`);
        setTransactions(transactionsData);
        calculateSummary(transactionsData);
      }
    } catch (error) {
      logger.error('获取交易数据失败:', error);
      setError(tError('generic'));
      setTransactions([]);
      setSummary({
        totalIn: 0,
        totalOut: 0,
        netAmount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 计算交易汇总数据
  const calculateSummary = (txs: Transaction[]) => {
    const summary = txs.reduce((acc, tx) => {
      try {
        // 尝试统一处理所有交易金额
        let amount = 0;
        
        // 日志原始数据用于调试
        logger.log(`[交易汇总调试] 处理交易: ${tx.hash.substring(0, 10)}..., 链: ${tx.chain}, 硬币: ${tx.coin}, 方向: ${tx.direction}, 原始金额: ${tx.amount}`);
        
        // 根据金额格式选择处理方法
        if (tx.amount.includes('.')) {
          // 如果是带小数点的数字，直接用parseFloat
          amount = parseFloat(tx.amount);
          logger.log(`汇总计算 (小数): ${tx.hash.substring(0, 8)} - 原始金额=${tx.amount}, 解析后=${amount}`);
        } else {
          // 对于大整数金额 (按6位小数存储)
          try {
            amount = parseFloat(formatUnits(BigInt(tx.amount), 6));
            logger.log(`汇总计算 (BigInt): ${tx.hash.substring(0, 8)} - 原始金额=${tx.amount}, 解析后=${amount}, 链=${tx.chain}`);
          } catch (err) {
            // 如果BigInt转换失败，回退到简单除法
            amount = parseInt(tx.amount) / 1000000;
            logger.log(`汇总计算 (回退): ${tx.hash.substring(0, 8)} - 原始金额=${tx.amount}, 解析后=${amount}, 错误=${err instanceof Error ? err.message : 'unknown error'}`);
          }
        }
        
        if (tx.direction === 'in') {
          return {
            ...acc,
            totalIn: acc.totalIn + amount,
            netAmount: acc.netAmount + amount
          };
        } else {
          return {
            ...acc,
            totalOut: acc.totalOut + amount,
            netAmount: acc.netAmount - amount
          };
        }
      } catch (err) {
        logger.error(`汇总计算出错:`, err, tx);
        return acc;
      }
    }, {
      totalIn: 0,
      totalOut: 0,
      netAmount: 0
    });
    
    logger.log('交易汇总:', summary);
    setSummary(summary);
  };
  
  // 导出交易数据为CSV
  const exportCSV = () => {
    if (transactions.length === 0) return;
    
    const csvData = transactions.map(tx => ({
      Date: new Date(tx.timestamp * 1000).toLocaleDateString(),
      Time: new Date(tx.timestamp * 1000).toLocaleTimeString(),
      Direction: tx.direction === 'in' ? tTransaction('direction.in') : tTransaction('direction.out'),
      Amount: (parseInt(tx.amount) / 1000000).toFixed(2),
      Currency: tx.coin,
      From: tx.from,
      To: tx.to,
      Hash: tx.hash,
      Chain: tx.chain
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stablecoin_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化地址的辅助函数
  const formatAddress = (address: string) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
  };
  
  // 处理刷新按钮
  const handleRefresh = () => {
    if (address) {
      fetchTransactions(address, selectedChain);
    }
  };

  // 自动生成发票
  const handleCreateInvoice = (tx?: Transaction) => {
    // 如果没有指定交易，使用最新的一笔入账交易
    if (!tx) {
      const incomingTx = transactions.find(t => t.direction === 'in');
      if (incomingTx) {
        setSelectedTransaction(incomingTx);
      } else if (transactions.length > 0) {
        // 如果没有入账交易，使用第一笔交易
        setSelectedTransaction(transactions[0]);
      } else {
        return; // 没有交易可用
      }
    } else {
      setSelectedTransaction(tx);
    }
    
    // 显示发票模态框
    setShowInvoiceModal(true);
  };

  // 生成所有交易的汇总发票
  const handleCreateAllTransactionsInvoice = () => {
    // 使用当前所有交易
    if (transactions.length === 0) {
      return; // 没有交易可用
    }
    
    // 计算总金额
    const totalAmount = transactions.reduce((sum, tx) => {
      const amount = parseInt(tx.amount) / 1000000;
      if (tx.direction === 'in') {
        return sum + amount;
      } else {
        return sum - amount;
      }
    }, 0);
    
    // 创建一个虚拟的汇总交易
    const summaryTransaction: Transaction = {
      timestamp: Date.now(),
      hash: `summary-${Date.now()}`,
      from: transactions[0].from,
      to: transactions[0].to,
      amount: (totalAmount * 1000000).toString(),
      direction: totalAmount >= 0 ? 'in' : 'out',
      formattedDate: new Date().toLocaleDateString(),
      coin: 'USDC',
      chain: 'solana',
      allTransactions: transactions // 添加所有交易记录
    };
    
    setSelectedTransaction(summaryTransaction);
    setShowInvoiceModal(true);
  };

  // 关闭发票模态框
  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedTransaction(null);
  };

  // 在generatePDF函数中添加对多个交易的处理
  const generatePDF = async () => {
    const element = document.getElementById('invoice-modal-content');
    if (!element || !selectedTransaction) return;
    
    try {
      // 强制设置样式为白底黑字
      const styles = document.createElement('style');
      styles.innerHTML = `
        #invoice-modal-content * {
          color: black !important;
          background-color: white !important;
          background: white !important;
          border-color: #e5e7eb !important;
        }
        #invoice-modal-content table {
          border-collapse: collapse !important;
        }
        #invoice-modal-content th, #invoice-modal-content td {
          border: 1px solid #e5e7eb !important;
        }
        #invoice-modal-content th {
          background-color: #f9fafb !important;
        }
      `;
      document.head.appendChild(styles);
      
      // 使用html2canvas捕获整个发票
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (document) => {
          // 需要转换为PDF，获取所有交易表格元素
          const elements = document.querySelectorAll('.transaction-table, .transaction-table *, .summary-data, .summary-data *');
          
          // 遍历所有元素，设置文本和背景颜色
          elements.forEach(el => {
            // 确保元素是HTMLElement类型才设置样式
            if (el instanceof HTMLElement) {
              // 强制设置白底黑字
              el.style.color = 'black';
              el.style.backgroundColor = 'white';
            }
          });
        }
      });
      
      // 清理临时样式
      document.head.removeChild(styles);
      
      const imgData = canvas.toDataURL('image/png');
      
      // 创建PDF并使用图像模式，避免字体问题
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4宽度(mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // 保存PDF
      const invoiceNumber = selectedTransaction ? 
        `INV-${selectedTransaction.hash.substring(0, 8)}` : 
        `INV-${new Date().getTime().toString().substring(0, 8)}`;
        
      pdf.save(`invoice_${invoiceNumber}.pdf`);
    } catch (error) {
      logger.error('生成PDF时出错:', error);
      
      // 备选方案：如果html2canvas方法失败，使用简单的表格导出
      try {
        const pdf = new jsPDF();
        
        // 使用基本的表格格式
        const invoiceNumber = selectedTransaction ? 
          `INV-${selectedTransaction.hash.substring(0, 8)}` : 
          `INV-${new Date().getTime().toString().substring(0, 8)}`;
          
        const invoiceDate = selectedTransaction?.formattedDate || new Date().toLocaleDateString();
        const amount = selectedTransaction ? 
          (parseInt(selectedTransaction.amount) / 1000000).toFixed(2) : '0.00';
        
        // 仅使用英文字符
        pdf.text('Invoice', 105, 20, { align: 'center' });
        pdf.text(`Number: ${invoiceNumber}`, 20, 30);
        pdf.text(`Date: ${invoiceDate}`, 20, 40);
        
        // 简单表格
        pdf.rect(20, 50, 80, 10);
        pdf.rect(100, 50, 90, 10);
        pdf.text('Description', 25, 57);
        pdf.text('Amount (USDC)', 105, 57);
        
        // 如果是汇总交易，则添加所有交易
        if ('allTransactions' in selectedTransaction && selectedTransaction.allTransactions) {
          let yPos = 67;
          
          selectedTransaction.allTransactions.forEach((tx, index) => {
            // 检查是否需要新页面
            if (yPos > 250) {
              pdf.addPage();
              yPos = 30;
              
              // 添加表头到新页面
              pdf.rect(20, yPos - 10, 80, 10);
              pdf.rect(100, yPos - 10, 90, 10);
              pdf.text('Description', 25, yPos - 3);
              pdf.text('Amount (USDC)', 105, yPos - 3);
              yPos += 7;
            }
            
            const txAmount = (parseInt(tx.amount) / 1000000).toFixed(2);
            const direction = tx.direction === 'in' ? '+' : '-';
            
            pdf.rect(20, yPos - 7, 80, 10);
            pdf.rect(100, yPos - 7, 90, 10);
            pdf.text(`${tx.formattedDate} - ${tx.hash.substring(0, 8)}`, 25, yPos);
            pdf.text(`${direction}$${txAmount}`, 105, yPos);
            
            yPos += 10;
          });
          
          // 添加总计
          pdf.rect(100, yPos - 7, 90, 10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Total: $${amount}`, 105, yPos);
        } else {
          pdf.rect(20, 60, 80, 10);
          pdf.rect(100, 60, 90, 10);
          pdf.text(`Transaction ${selectedTransaction?.hash.substring(0, 8) || ''}`, 25, 67);
          pdf.text(`$${amount}`, 105, 67);
          
          pdf.rect(100, 70, 90, 10);
          pdf.text(`Total: $${amount}`, 105, 77);
        }
        
        pdf.save(`simple_invoice_${invoiceNumber}.pdf`);
      } catch (backupError) {
        logger.error('备选PDF生成也失败:', backupError);
        alert('无法生成PDF，请稍后再试');
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 bg-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          {tHome('welcome')}
        </h1>
        
        <p className="text-center mb-8 text-gray-600 text-sm">
          {tHome('supportInfo')}
        </p>
        
        {/* 钱包选择器/连接 */}
        <div className="mb-8 w-full max-w-md mx-auto">
          <WalletSelector />
        </div>
        
        {/* 交易数据显示 */}
        <div className="w-full max-w-4xl mx-auto">
          {/* 交易摘要信息 */}
          {transactions.length > 0 && (
            <div className="bg-white p-6 rounded-lg mb-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-5 text-gray-800">{tTransaction('title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-5 rounded-lg shadow-sm border border-green-100 transaction-summary-card">
                  <div className="text-green-700 font-medium mb-2">{tTransaction('direction.in')}</div>
                  <div className="text-3xl font-bold text-green-800">${summary.totalIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div className="bg-red-50 p-5 rounded-lg shadow-sm border border-red-100 transaction-summary-card">
                  <div className="text-red-700 font-medium mb-2">{tTransaction('direction.out')}</div>
                  <div className="text-3xl font-bold text-red-800">${summary.totalOut.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div className={`${summary.netAmount >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} p-5 rounded-lg shadow-sm border transaction-summary-card`}>
                  <div className={`${summary.netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'} font-medium mb-2`}>{tTransaction('netAmount')}</div>
                  <div className={`text-3xl font-bold ${summary.netAmount >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>${summary.netAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={exportCSV}
                  className="bg-gray-700 text-white py-2 px-4 rounded-md text-sm hover:bg-gray-600 mr-3"
                >
                  {tCommon('export')}
                </button>
                <button
                  onClick={handleRefresh}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-500"
                >
                  {tCommon('refresh')}
                </button>
              </div>
            </div>
          )}
          
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <span className="ml-3 text-lg text-gray-900">{tCommon('loading')}</span>
            </div>
          )}
          
          {/* 错误消息 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* 交易记录表格 */}
          {!isLoading && transactions.length > 0 && (
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg mb-6 border border-gray-200">
              <table className="min-w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold">{tTransaction('date')}</th>
                    <th className="py-3 px-4 text-left font-semibold">{tTransaction('type')}</th>
                    <th className="py-3 px-4 text-left font-semibold">{tTransaction('amount')}</th>
                    <th className="py-3 px-4 text-left font-semibold">{tTransaction('from')}</th>
                    <th className="py-3 px-4 text-left font-semibold">{tTransaction('to')}</th>
                    <th className="py-3 px-4 text-left font-semibold">{tTransaction('hash')}</th>
                    <th className="py-3 px-4 text-center font-semibold">{tCommon('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4 text-gray-900">{tx.formattedDate}</td>
                      <td className={`py-3 px-4 font-medium ${tx.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.direction === 'in' ? tTransaction('direction.in') : tTransaction('direction.out')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {(parseInt(tx.amount) / 1000000).toFixed(2)} {tx.coin}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-700">
                        {formatAddress(tx.from)}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-700">
                        {formatAddress(tx.to)}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-700">
                        <a 
                          href={tx.chain === 'solana' 
                            ? `https://solscan.io/tx/${tx.hash}`
                            : `https://etherscan.io/tx/${tx.hash}`
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {tx.hash.substring(0, 10)}...
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleCreateInvoice(tx)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded-md"
                        >
                          {tInvoice('generate')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 没有交易时显示 */}
          {!isLoading && transactions.length === 0 && !error && (
            <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
              <p className="text-lg text-gray-600 mb-4">{tTransaction('noTransactions')}</p>
              <p className="text-gray-700">{tWallet('connect')}</p>
            </div>
          )}
          
          {/* 发票生成链接 - 替换原来的按钮功能 */}
          {transactions.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={handleCreateAllTransactionsInvoice} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md"
              >
                {tInvoice('generate')}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 发票模态框 */}
      {showInvoiceModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4 bg-white">
              <h2 className="text-xl font-bold text-black">{tInvoice('title')}</h2>
              <button onClick={closeInvoiceModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div id="invoice-modal-content" className="p-6 bg-white text-black">
              <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-black">{tInvoice('title')}</h2>
                <p className="text-gray-700">{tInvoice('invoiceNumber')}: INV-{selectedTransaction.hash.substring(0, 8)}</p>
                <p className="text-gray-700">{tInvoice('date')}: {selectedTransaction.formattedDate}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold mb-2 text-black">{tInvoice('recipient')}:</h3>
                  <p className="bg-gray-100 p-2 rounded break-all font-mono text-sm text-gray-800">
                    {selectedTransaction.to}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-black">{tInvoice('sender')}:</h3>
                  <p className="bg-gray-100 p-2 rounded break-all font-mono text-sm text-gray-800">
                    {selectedTransaction.from}
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border text-black">{tInvoice('description')}</th>
                      <th className="text-right p-3 border w-1/4 text-black">{tInvoice('amount')} ({selectedTransaction.coin})</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {'allTransactions' in selectedTransaction && selectedTransaction.allTransactions ? (
                      // 如果是汇总交易，显示所有交易
                      selectedTransaction.allTransactions.map((tx, index) => (
                        <tr key={index}>
                          <td className="p-3 border text-gray-800">
                            {tx.formattedDate} - {tx.hash.substring(0, 10)}
                          </td>
                          <td className={`p-3 border text-right ${tx.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.direction === 'in' ? '+' : '-'}${(parseInt(tx.amount) / 1000000).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      // 单条交易
                      <tr>
                        <td className="p-3 border text-gray-800">{tInvoice('title')} - {selectedTransaction.hash.substring(0, 10)}</td>
                        <td className="p-3 border text-right text-gray-800">${(parseInt(selectedTransaction.amount) / 1000000).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-white">
                    <tr className="font-bold">
                      <td className="p-3 text-right text-black">{tInvoice('total')}:</td>
                      <td className="p-3 text-right text-black">${(parseInt(selectedTransaction.amount) / 1000000).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-end space-x-4 bg-white">
              <button
                onClick={closeInvoiceModal}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-800"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={generatePDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {tInvoice('download')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 