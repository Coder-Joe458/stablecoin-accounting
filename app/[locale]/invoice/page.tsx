"use client";

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function InvoicePage() {
  const { address, isConnected } = useAccount();
  const locale = useLocale();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fromAddress: '',
    toAddress: '',
    amount: '100.00',  // 预设金额
    description: '',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  });
  const [previewMode, setPreviewMode] = useState(false);
  
  // 加载翻译
  const t = useTranslations();
  const tInvoice = useTranslations('invoice');
  const tCommon = useTranslations('common');
  const tWallet = useTranslations('wallet');

  // 当用户连接钱包后自动填充收款地址
  useEffect(() => {
    if (isConnected && address) {
      // 自动填充更多信息以提供更好的用户体验
      setFormData(prev => ({
        ...prev,
        fromAddress: address,
        // 默认使用某个收款地址作为例子
        toAddress: prev.toAddress || 'DSgydDHd834rkxvFVeukZGt4sGUxjd5WW4qySLy5A5LX',
        // 默认描述
        description: prev.description || tInvoice('title')
      }));
    }
  }, [isConnected, address, tInvoice]);

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
        <title>${tInvoice('title')} ${formData.invoiceNumber}</title>
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
            <h1 class="invoice-title">${tInvoice('title')}</h1>
            <p>${tInvoice('invoiceNumber')}: ${formData.invoiceNumber}</p>
            <p>${tInvoice('date')}: ${formData.date}</p>
          </div>
          
          <div class="invoice-details">
            <div class="invoice-details-group">
              <h3>${tInvoice('recipient')}:</h3>
              <p class="address">${formData.fromAddress}</p>
            </div>
            <div class="invoice-details-group">
              <h3>${tInvoice('sender')}:</h3>
              <p class="address">${formData.toAddress}</p>
            </div>
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>${tInvoice('description')}</th>
                <th>${tInvoice('amount')} (USDC)</th>
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
            ${tInvoice('total')}: $${parseFloat(formData.amount).toFixed(2)} USDC
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
          <h1 className="text-2xl font-bold">{tInvoice('generate')}</h1>
          <Link href={locale === 'en' ? '/en' : '/'} className="text-blue-600 hover:text-blue-800">
            {tCommon('back')}
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
              <h2 className="text-2xl font-bold">{tInvoice('title')}</h2>
              <p className="text-gray-600">{tInvoice('invoiceNumber')}: {formData.invoiceNumber}</p>
              <p className="text-gray-600">{tInvoice('date')}: {formData.date}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold mb-2">{tInvoice('recipient')}:</h3>
                <p className="bg-gray-100 p-2 rounded break-all font-mono text-sm">
                  {formData.fromAddress}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{tInvoice('sender')}:</h3>
                <p className="bg-gray-100 p-2 rounded break-all font-mono text-sm">
                  {formData.toAddress}
                </p>
              </div>
            </div>
            
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border">{tInvoice('description')}</th>
                    <th className="text-right p-3 border w-1/4">{tInvoice('amount')} (USDC)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border">{formData.description}</td>
                    <td className="p-3 border text-right">${parseFloat(formData.amount || '0').toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className="p-3 text-right">{tInvoice('total')}:</td>
                    <td className="p-3 text-right">${parseFloat(formData.amount || '0').toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="flex space-x-4 justify-end">
              <button
                onClick={handleEdit}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                {tCommon('edit')}
              </button>
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {tInvoice('download')}
              </button>
            </div>
          </div>
        ) : (
          // 发票表单
          <form onSubmit={handlePreview} className="bg-white shadow-md rounded-lg p-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="font-medium">{tCommon('info')}: {tInvoice('formInstructions') || '已自动填充表单，请根据需要修改字段，然后点击预览生成发票。'}</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{tInvoice('title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">{tInvoice('invoiceNumber')}</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">{tInvoice('date')}</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{tInvoice('recipient')}</h2>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">{tInvoice('walletAddress')}</label>
                <input
                  type="text"
                  name="fromAddress"
                  value={formData.fromAddress}
                  onChange={handleChange}
                  className="w-full p-2 border rounded font-mono bg-gray-50"
                  placeholder={tWallet?.('enterAddress') || "输入收款方钱包地址"}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{tInvoice('sender')}</h2>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">{tInvoice('walletAddress')}</label>
                <input
                  type="text"
                  name="toAddress"
                  value={formData.toAddress}
                  onChange={handleChange}
                  className="w-full p-2 border rounded font-mono bg-gray-50"
                  placeholder={tWallet?.('enterAddress') || "输入付款方钱包地址"}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">{tInvoice('details')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">{tInvoice('amount')} (USDC)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-gray-50 font-medium"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">{tInvoice('description')}</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border rounded bg-gray-50"
                    placeholder={tInvoice('description')}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                {tInvoice('preview')}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
} 