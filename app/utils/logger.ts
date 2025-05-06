import config from './env-config';

// 日志工具，根据环境控制日志输出
const logger = {
  log: (...args: any[]) => {
    // 仅在开发环境或明确启用日志时输出
    if (config.logging.enableLogs) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // 错误日志在所有环境中都输出
    console.error(...args);
  },
  debug: (...args: any[]) => {
    // 调试日志仅在开发环境和明确启用debug日志时输出
    if (config.logging.enableDebug) {
      console.log('[DEBUG]', ...args);
    }
  },
  warn: (...args: any[]) => {
    // 警告日志在所有环境中都输出，但可以通过配置禁用
    if (!config.logging.disableWarnings) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    // 信息日志与普通日志相同
    if (config.logging.enableLogs) {
      console.info(...args);
    }
  }
};

export default logger; 