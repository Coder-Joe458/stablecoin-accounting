"use client";

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import ClientEntry from '../client-entry';

// Client component that uses wagmi hooks
function InvoiceContent() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    fromAddress: '',
    toAddress: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  });
  const [previewMode, setPreviewMode] = useState(false);

  // 当用户连接钱包后自动填充收款地址
  useEffect(() => {
    if (isConnected && address) {
      setFormData(prev => ({
        ...prev,
        fromAddress: address
      }));
    }
  }, [isConnected, address]);

  // 处理表单变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 生成预览
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewMode(true);
  };

  // 返回编辑表单
  const handleEdit = () => {
    setPreviewMode(false);
  };

  // 下载HTML发票
  const handleDownload = () => {
    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>发票 ${formData.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #eee;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .invoice-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .invoice-details-group {
            font-size: 14px;
          }
          .invoice-details-group p {
            margin: 4px 0;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .invoice-table th {
            background-color: #f8f8f8;
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .invoice-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .invoice-total {
            text-align: right;
            margin-top: 20px;
            font-size: 18px;
            font-weight: bold;
          }
          .address {
            word-break: break-all;
            font-size: 12px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <h1 class="invoice-title">发票</h1>
            <p>发票编号: ${formData.invoiceNumber}</p>
            <p>日期: ${formData.date}</p>
          </div>
          
          <div class="invoice-details">
            <div class="invoice-details-group">
              <h3>收款方:</h3>
              <p class="address">${formData.fromAddress}</p>
            </div>
            <div class="invoice-details-group">
              <h3>付款方:</h3>
              <p class="address">${formData.toAddress}</p>
            </div>
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>描述</th>
                <th>金额 (USDC)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${formData.description}</td>
                <td>$${parseFloat(formData.amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="invoice-total">
            总计: $${parseFloat(formData.amount).toFixed(2)} USDC
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice_${formData.invoiceNumber}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">发票生成器</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            返回主页
          </Link>
        </div>
        
        {/* 钱包连接区域 */}
        <div className="flex justify-center mb-4">
          <ConnectButton />
        </div>
        
        {previewMode ? (
          // 发票预览
          <div className="border rounded-lg shadow-lg p-8 bg-white">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold">发票</h2>
              <p className="text-gray-600">发票编号: {formData.invoiceNumber}</p>
              <p className="text-gray-600">日期: {formData.date}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold mb-2">收款方:</h3>
                <p className="text-sm font-mono break-all">{formData.fromAddress}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">付款方:</h3>
                <p className="text-sm font-mono break-all">{formData.toAddress}</p>
              </div>
            </div>
            
            <table className="w-full mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left">描述</th>
                  <th className="py-2 px-4 text-right">金额 (USDC)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-4 px-4">{formData.description}</td>
                  <td className="py-4 px-4 text-right">${parseFloat(formData.amount || '0').toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td className="py-4 px-4 font-bold">总计</td>
                  <td className="py-4 px-4 text-right font-bold">${parseFloat(formData.amount || '0').toFixed(2)} USDC</td>
                </tr>
              </tfoot>
            </table>
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={handleEdit}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                编辑
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                下载HTML发票
              </button>
            </div>
          </div>
        ) : (
          // 表单
          <form onSubmit={handlePreview} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fromAddress">
                收款地址
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
                id="fromAddress"
                name="fromAddress"
                type="text"
                value={formData.fromAddress}
                onChange={handleChange}
                placeholder="0x..."
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="toAddress">
                付款地址
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
                id="toAddress"
                name="toAddress"
                type="text"
                value={formData.toAddress}
                onChange={handleChange}
                placeholder="0x..."
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                金额 (USDC)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                日期
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                交易描述
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="输入交易的描述..."
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                生成预览
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

// Main page component that wraps the client content with ClientEntry
export default function InvoicePage() {
  return (
    <ClientEntry>
      <InvoiceContent />
    </ClientEntry>
  );
} 