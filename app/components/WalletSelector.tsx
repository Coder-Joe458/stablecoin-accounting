"use client";

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useLocale, useTranslations } from 'next-intl';

// 定义钱包中可能支持的所有链类型
type ChainType = 'ethereum' | 'solana' | 'polygon' | 'base' | 'bitcoin';

// 定义钱包配置类型
interface WalletConfig {
  type: ChainType;
  name: string;
  address?: string;
  className?: string;
}

export default function WalletSelector() {
  const { address, isConnected } = useAccount();
  const locale = useLocale();
  const [selectedChainType, setSelectedChainType] = useState<ChainType>('ethereum');
  const [availableChains, setAvailableChains] = useState<WalletConfig[]>([]);
  const [expandChainSelect, setExpandChainSelect] = useState(false);
  
  // 钱包配置 - 根据当前语言设置名称
  const walletConfigs: WalletConfig[] = [
    { 
      type: 'ethereum', 
      name: locale === 'zh' ? '以太坊' : 'Ethereum', 
      className: 'bg-blue-600 hover:bg-blue-700' 
    },
    { 
      type: 'solana', 
      name: 'Solana', 
      className: 'bg-purple-600 hover:bg-purple-700' 
    },
    { 
      type: 'polygon', 
      name: 'Polygon', 
      className: 'bg-indigo-600 hover:bg-indigo-700' 
    },
    { 
      type: 'base', 
      name: 'Base', 
      className: 'bg-cyan-600 hover:bg-cyan-700' 
    },
    { 
      type: 'bitcoin', 
      name: 'Bitcoin', 
      className: 'bg-orange-600 hover:bg-orange-700' 
    }
  ];
  
  // 检测钱包类型
  useEffect(() => {
    if (isConnected && address) {
      // 默认情况下，如果地址以0x开头，设置为以太坊
      const defaultChain: ChainType = address.startsWith('0x') ? 'ethereum' : 'solana';
      setSelectedChainType(defaultChain);
      
      // 这里模拟一个场景，用户有多个链的地址
      // 在实际应用中，你需要使用SDK或API来获取用户的所有链地址
      const mockAvailableChains: WalletConfig[] = [
        { 
          type: 'ethereum' as ChainType, 
          name: locale === 'zh' ? '以太坊' : 'Ethereum', 
          address: address, 
          className: 'bg-blue-600 hover:bg-blue-700' 
        },
        { 
          type: 'solana' as ChainType, 
          name: 'Solana', 
          address: 'DSgydDHd834rkxvFVeukZGt4sGUxjd5WW4qySLy5A5LX', 
          className: 'bg-purple-600 hover:bg-purple-700' 
        },
        { 
          type: 'polygon' as ChainType, 
          name: 'Polygon', 
          address: address, 
          className: 'bg-indigo-600 hover:bg-indigo-700' 
        },
        { 
          type: 'base' as ChainType, 
          name: 'Base', 
          address: address, 
          className: 'bg-cyan-600 hover:bg-cyan-700' 
        }
      ];
      
      setAvailableChains(mockAvailableChains);
    }
  }, [isConnected, address, locale]);
  
  // 选择链类型
  const selectChain = (chainType: ChainType) => {
    setSelectedChainType(chainType);
    setExpandChainSelect(false);
    
    // 根据选择的链类型获取对应的地址
    const selectedChain = availableChains.find(chain => chain.type === chainType);
    if (selectedChain && selectedChain.address) {
      // 触发自定义事件，通知其他组件链已更改
      const event = new CustomEvent('chain-changed', {
        detail: {
          chain: chainType,
          address: selectedChain.address
        }
      });
      window.dispatchEvent(event);
    }
  };
  
  // 渲染当前选中的链
  const renderSelectedChain = () => {
    const selected = availableChains.find(chain => chain.type === selectedChainType);
    if (!selected) return null;
    
    return (
      <button 
        onClick={() => setExpandChainSelect(!expandChainSelect)}
        className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${selected.className}`}
      >
        {getChainIcon(selected.type)}
        <span>{selected.name}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transform transition-transform ${expandChainSelect ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  };
  
  // 获取链对应的图标
  const getChainIcon = (chainType: ChainType) => {
    switch(chainType) {
      case 'ethereum':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L5 12L12 16L19 12L12 2Z" fill="currentColor" />
            <path d="M12 16V22L19 12L12 16Z" fill="currentColor" fillOpacity="0.8" />
            <path d="M12 16L5 12L12 22V16Z" fill="currentColor" fillOpacity="0.6" />
          </svg>
        );
      case 'solana':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7H15.5L4 18.5V7Z" fill="currentColor" />
            <path d="M4 18.5L15.5 7H20L8.5 18.5H4Z" fill="currentColor" fillOpacity="0.8" />
            <path d="M8.5 18.5H20V7H15.5L8.5 18.5Z" fill="currentColor" fillOpacity="0.6" />
          </svg>
        );
      case 'polygon':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 9L6 18H18L21 9L12 2Z" fill="currentColor" />
          </svg>
        );
      case 'bitcoin':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path d="M15 9.5C15 7.5 13.5 7 12 7V6H11V7H9V6H8V7H7V8H8V16H7V17H8V18H9V17H11V18H12V17C14.5 17 16 15.5 16 14C16 12.5 15 11.5 14 11C14.5 10.5 15 10 15 9.5ZM10 8H12C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12H10V8ZM12 16H10V12H12C13.1 12 14 12.9 14 14C14 15.1 13.1 16 12 16Z" fill="white" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="currentColor" />
          </svg>
        );
    }
  };
  
  const connectedText = locale === 'zh' ? '当前连接:' : 'Connected:';
  const walletText = locale === 'zh' ? '钱包' : 'Wallet';
  const connectWalletText = locale === 'zh' ? '连接钱包' : 'Connect Wallet';
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-row items-center justify-center gap-4">
        {/* 使用自定义配置的ConnectButton，隐藏网络选择和余额 */}
        <ConnectButton 
          showBalance={false}
          chainStatus="none"
          label={connectWalletText}
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
        
        {/* 显示网络选择按钮 */}
        {isConnected && availableChains.length > 0 && (
          <div className="relative">
            {renderSelectedChain()}
            
            {expandChainSelect && (
              <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg z-10 min-w-48 border border-gray-200">
                {availableChains.map((chain) => (
                  <button
                    key={chain.type}
                    onClick={() => selectChain(chain.type)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                      selectedChainType === chain.type ? 'bg-gray-100 font-medium' : ''
                    }`}
                  >
                    {getChainIcon(chain.type)}
                    <div className="flex flex-col">
                      <span>{chain.name}</span>
                      <span className="text-xs text-gray-500 truncate max-w-36">{chain.address}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {isConnected && (
        <div className="mt-2 text-sm text-gray-500">
          {connectedText} <span className="font-medium">
            {walletConfigs.find(c => c.type === selectedChainType)?.name || (locale === 'zh' ? '未知链' : 'Unknown Chain')} {walletText}
          </span>
        </div>
      )}
    </div>
  );
} 