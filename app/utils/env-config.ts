// 环境配置
const config = {
  // 判断当前是否为生产环境
  isProd: process.env.NODE_ENV === 'production',
  
  // 日志配置
  logging: {
    // 使用环境变量控制普通日志输出
    enableLogs: process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true',
    
    // 使用环境变量控制调试日志输出
    enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
    
    // 使用环境变量控制警告输出
    disableWarnings: process.env.NEXT_PUBLIC_DISABLE_WARNINGS === 'true'
  },
  
  // API配置
  api: {
    // API密钥应该从环境变量中获取
    alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo'
  }
};

export default config; 