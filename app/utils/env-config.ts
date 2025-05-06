// 环境配置
const config = {
  // 判断当前是否为生产环境
  isProd: process.env.NODE_ENV === 'production',
  
  // 日志配置
  logging: {
    // 在生产环境中禁用普通日志，在开发环境中启用
    enableLogs: process.env.NODE_ENV !== 'production',
    
    // 在生产环境中禁用调试日志
    enableDebug: process.env.NODE_ENV !== 'production',
    
    // 始终显示警告和错误
    disableWarnings: false
  },
  
  // API配置
  api: {
    // API密钥应该从环境变量中获取
    alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo'
  }
};

export default config; 