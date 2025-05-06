import {getRequestConfig} from 'next-intl/server';

// 内联定义翻译消息，避免导入JSON文件
const messages = {
  zh: {
    app: {
      title: "稳定币记账系统",
      description: "轻松管理您的稳定币交易记录"
    },
    common: {
      loading: "加载中...",
      error: "出错了",
      submit: "提交",
      cancel: "取消",
      save: "保存",
      delete: "删除",
      edit: "编辑",
      search: "搜索",
      back: "返回",
      next: "下一步",
      previous: "上一步",
      export: "导出",
      refresh: "刷新",
      info: "提示",
      action: "操作"
    },
    nav: {
      home: "首页",
      transactions: "交易记录",
      invoice: "发票",
      settings: "设置"
    },
    home: {
      welcome: "欢迎使用稳定币记账系统",
      getStarted: "开始使用",
      recentTransactions: "最近交易",
      supportInfo: "目前仅支持 Solana 区块链上的 USDC"
    },
    wallet: {
      connect: "连接钱包",
      disconnect: "断开连接",
      address: "钱包地址",
      balance: "余额",
      copy: "复制地址",
      copied: "已复制",
      enterAddress: "输入钱包地址"
    },
    transaction: {
      title: "交易",
      id: "交易ID",
      hash: "交易哈希",
      from: "发送方",
      to: "接收方",
      amount: "金额",
      date: "日期",
      time: "时间",
      type: "类型",
      status: "状态",
      netAmount: "净额",
      direction: {
        in: "转入",
        out: "转出"
      },
      details: "交易详情",
      noTransactions: "没有交易记录",
      loadMore: "加载更多"
    },
    invoice: {
      title: "发票",
      generate: "生成发票",
      download: "下载发票",
      print: "打印发票",
      recipient: "收款方",
      sender: "付款方",
      date: "日期",
      dueDate: "截止日期",
      invoiceNumber: "发票编号",
      notes: "备注",
      subtotal: "小计",
      tax: "税费",
      total: "总计",
      description: "描述",
      details: "明细",
      walletAddress: "钱包地址",
      preview: "预览",
      formInstructions: "已自动填充表单，请根据需要修改字段，然后点击预览生成发票。"
    },
    settings: {
      title: "设置",
      language: "语言",
      theme: "主题",
      currency: "货币",
      notification: "通知",
      darkMode: "深色模式",
      account: "账户设置"
    },
    language: {
      title: "选择语言",
      en: "English",
      zh: "中文"
    },
    error: {
      generic: "发生了错误，请重试",
      network: "网络错误，请检查您的网络连接",
      walletConnect: "连接钱包时出错",
      invalidAddress: "无效的钱包地址",
      transactionFailed: "交易失败",
      rateLimited: "请求过于频繁，请稍后重试",
      unsupportedChain: "目前仅支持 Solana 区块链上的 USDC。不支持其他区块链。"
    }
  },
  en: {
    app: {
      title: "Stablecoin Accounting System",
      description: "Easily manage your stablecoin transaction records"
    },
    common: {
      loading: "Loading...",
      error: "Error",
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      back: "Back",
      next: "Next",
      previous: "Previous",
      export: "Export",
      refresh: "Refresh",
      info: "Info",
      action: "Action"
    },
    nav: {
      home: "Home",
      transactions: "Transactions",
      invoice: "Invoice",
      settings: "Settings"
    },
    home: {
      welcome: "Welcome to Stablecoin Accounting System",
      getStarted: "Get Started",
      recentTransactions: "Recent Transactions",
      supportInfo: "Currently only supports USDC on the Solana blockchain"
    },
    wallet: {
      connect: "Connect Wallet",
      disconnect: "Disconnect",
      address: "Wallet Address",
      balance: "Balance",
      copy: "Copy Address",
      copied: "Copied",
      enterAddress: "Enter Wallet Address"
    },
    transaction: {
      title: "Transaction",
      id: "Transaction ID",
      hash: "Transaction Hash",
      from: "From",
      to: "To",
      amount: "Amount",
      date: "Date",
      time: "Time",
      type: "Type",
      status: "Status",
      netAmount: "Net Amount",
      direction: {
        in: "Inbound",
        out: "Outbound"
      },
      details: "Transaction Details",
      noTransactions: "No transactions found",
      loadMore: "Load More"
    },
    invoice: {
      title: "Invoice",
      generate: "Generate Invoice",
      download: "Download Invoice",
      print: "Print Invoice",
      recipient: "Recipient",
      sender: "Sender",
      date: "Date",
      dueDate: "Due Date",
      invoiceNumber: "Invoice Number",
      notes: "Notes",
      subtotal: "Subtotal",
      tax: "Tax",
      total: "Total",
      description: "Description",
      details: "Details",
      walletAddress: "Wallet Address",
      preview: "Preview",
      formInstructions: "The form has been auto-filled. Please modify fields as needed, then click Preview to generate invoice."
    },
    settings: {
      title: "Settings",
      language: "Language",
      theme: "Theme",
      currency: "Currency",
      notification: "Notification",
      darkMode: "Dark Mode",
      account: "Account Settings"
    },
    language: {
      title: "Select Language",
      en: "English",
      zh: "中文"
    },
    error: {
      generic: "An error occurred, please try again",
      network: "Network error, please check your connection",
      walletConnect: "Error connecting wallet",
      invalidAddress: "Invalid wallet address",
      transactionFailed: "Transaction failed",
      rateLimited: "Too many requests, please try again later",
      unsupportedChain: "Currently only supports USDC on the Solana blockchain. No support for other blockchains."
    }
  }
};

export default getRequestConfig(async ({locale}) => {
  // 确保locale总是有一个有效值
  const localeToUse = locale || 'zh';
  
  // 明确返回locale和messages
  return { 
    locale: localeToUse,
    messages: messages[localeToUse as keyof typeof messages] 
  };
}); 