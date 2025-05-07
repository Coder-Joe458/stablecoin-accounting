// 稳定币代币合约地址
import logger from '../utils/logger';

export const STABLECOIN_CONTRACTS = {
  // Solana地址
  SOLANA: {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT on Solana
  }
};

// 添加通用工具函数
// 延迟函数 - 在异步代码中等待指定毫秒数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 指数退避算法 - 根据重试次数计算等待时间，加入随机抖动避免请求风暴
// retry: 当前重试次数，从0开始
// baseDelay: 基础延迟时间（毫秒）
// maxDelay: 最大延迟时间（毫秒）
const exponentialBackoff = (retry: number, baseDelay: number = 3000, maxDelay: number = 60000): number => {
  // 计算指数增长的延迟时间，但不超过最大值
  const calculatedDelay = Math.min(baseDelay * Math.pow(2, retry), maxDelay);
  // 加入随机抖动（0-2000毫秒）避免多个请求同时重试
  return calculatedDelay + (Math.random() * 2000);
};

// 记录响应头中的API使用情况，无论是成功还是失败的请求
const logApiUsage = (response: Response, apiType: string): void => {
  // 获取并记录常见的API限制相关头信息
  const rateLimitHeaders = {
    'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
    'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
    'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
    'retry-after': response.headers.get('retry-after')
  };
  
  // 只有当至少有一个限流相关头信息存在时才记录
  if (rateLimitHeaders['x-ratelimit-limit'] || 
      rateLimitHeaders['x-ratelimit-remaining'] || 
      rateLimitHeaders['x-ratelimit-reset']) {
    
    logger.log(`[API_USAGE] ${apiType} 请求状态: ${response.status}`, {
      timestamp: new Date().toISOString(),
      headers: rateLimitHeaders
    });
    
    // 如果有配额信息，计算剩余百分比
    const limit = rateLimitHeaders['x-ratelimit-limit'];
    const remaining = rateLimitHeaders['x-ratelimit-remaining'];
    
    if (limit && remaining) {
      const used = parseInt(limit) - parseInt(remaining);
      const usedPercent = (used / parseInt(limit) * 100).toFixed(1);
      const remainingPercent = (parseInt(remaining) / parseInt(limit) * 100).toFixed(1);
      
      logger.log(`[API_USAGE] ${apiType} 配额使用: ${used}/${limit} (已用 ${usedPercent}%, 剩余 ${remainingPercent}%)`);
      
      // 当剩余配额低于20%时发出警告
      if (parseInt(remainingPercent) < 20) {
        logger.warn(`[API_USAGE_WARNING] ${apiType} API配额即将耗尽! 仅剩 ${remainingPercent}% 的配额可用`);
      }
    }
  }
};

interface TransferData {
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress?: string;
  asset?: string;
  metadata: {
    blockTimestamp: string;
    [key: string]: any;
  };
}

interface AlchemyResponse {
  result?: {
    transfers?: TransferData[];
  };
  error?: {
    message: string;
    code: number;
  };
}

export interface Transaction {
  timestamp: number;
  hash: string;
  from: string;
  to: string;
  amount: string;
  direction: 'in' | 'out';
  formattedDate: string;
  coin: string;
  chain: string;
  allTransactions?: Transaction[]; // 添加可选的allTransactions字段，用于聚合多笔交易
}

// 判断是否为Solana地址
function isSolanaAddress(address: string): boolean {
  // 判断是否以0x开头 (以太坊地址特征)
  if (!address || address.trim() === '') {
    logger.debug('地址为空');
    return false;
  }
  
  if (address.startsWith('0x')) {
    logger.debug('检测到以太坊地址特征: 0x前缀');
    return false;
  }
  
  // Solana地址通常是base58编码的44个字符
  // 但也有一些特殊情况，可能更短或更长
  // 这里我们根据长度和格式来判断
  
  // 检查长度
  const isSolanaLength = address.length >= 32 && address.length <= 44;
  
  // 检查是否只包含Base58字符集 (不包含: 0, O, I, l)
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  const isBase58Format = base58Regex.test(address);
  
  logger.debug(`地址长度判断: ${isSolanaLength ? '可能是Solana地址' : '可能不是Solana地址'}, 长度=${address.length}`);
  logger.debug(`Base58格式判断: ${isBase58Format ? '是Base58格式' : '不是Base58格式'}`);
  
  return isSolanaLength && isBase58Format;
}

// 获取钱包的稳定币交易记录
export async function getUSDCTransactions(walletAddress: string, limit: number = 50): Promise<Transaction[]> {
  // 使用环境变量中的API密钥
  const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';
  const solanaBaseUrl = `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  
  logger.log(`开始获取钱包 ${walletAddress} 的稳定币交易，使用API密钥: ${ALCHEMY_API_KEY.substring(0, 4)}...`);
  
  try {
    // 检查地址是否为空或无效
    if (!walletAddress || walletAddress.trim() === '') {
      logger.error('提供的钱包地址为空，返回空数组');
      return [];
    }
    
    // 检查是否是Solana地址
    if (!isSolanaAddress(walletAddress)) {
      logger.error(`无效的Solana地址格式: ${walletAddress}，返回空数组`);
      return [];
    }
    logger.log(`检测到Solana地址`);
    
    // 获取Solana交易
    return await getSolanaTransactions(walletAddress, solanaBaseUrl, limit);
  } catch (error) {
    logger.error('获取稳定币交易失败:', error);
    // 出错时返回空数组，而不是抛出错误
    logger.log("由于错误，返回空数组");
    return [];
  }
}

// 获取Solana上的交易
async function getSolanaTransactions(
  walletAddress: string, 
  baseUrl: string,
  limit: number = 50
): Promise<Transaction[]> {
  logger.log("获取Solana稳定币交易...");
  logger.debug(`开始获取Solana交易 - 钱包地址: ${walletAddress}, 限制: ${limit}`);
  
  // 验证地址是否符合Solana地址格式
  if (!walletAddress || walletAddress.length < 32 || walletAddress.length > 44) {
    logger.debug(`地址格式无效 - 长度: ${walletAddress ? walletAddress.length : 0}`);
    return [];
  }
  
  // 再次确认地址是否是有效的Solana地址
  if (!isSolanaAddress(walletAddress)) {
    logger.debug(`地址未通过isSolanaAddress验证`);
    return [];
  }
  
  logger.debug(`地址 ${walletAddress} 验证通过，开始获取交易数据`);
  
  try {
    // 最大重试次数
    const maxRetries = 5; // 增加最大重试次数
    let retryCount = 0;
    let signaturesData;
    
    // 使用重试逻辑处理API限流
    while (retryCount <= maxRetries) {
      try {
        logger.debug(`发送Solana getSignaturesForAddress请求 - 尝试 #${retryCount + 1}`);
        // 使用Solana RPC API获取交易签名
        const signaturesResponse = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'getSignaturesForAddress',
            params: [
              walletAddress,
              {
                limit: Math.min(limit, 25) // 限制每次请求的数量
              }
            ]
          }),
        });

        signaturesData = await signaturesResponse.json();
        logger.log("收到Solana签名API响应:", signaturesData);
        logger.debug(`收到签名响应 - 状态码: ${signaturesResponse.status}, 数据长度: ${JSON.stringify(signaturesData).length}`);
        
        // 记录API使用情况，即使请求成功
        logApiUsage(signaturesResponse, 'Solana-Signatures');
        
        // 如果没有错误或者错误不是限流相关，跳出重试循环
        if (signaturesResponse.status === 429 || (signaturesData.error && signaturesData.error.code === 429)) {
          logRateLimitInfo(signaturesResponse, signaturesData, 'Solana-Signatures');
          retryCount++;
          const backoffTime = exponentialBackoff(retryCount);
          logger.log(`遇到API限流错误(429)，第 ${retryCount} 次重试，等待 ${backoffTime/1000} 秒...`);
          logger.debug(`API限流 - 错误码: ${signaturesData.error?.code}, 消息: ${signaturesData.error?.message}`);
          logger.error(`获取Solana签名失败: \n{code: ${signaturesData.error?.code}, message: '${signaturesData.error?.message || "Your app has been rate-limited due to unusually high global traffic. Consider upgrading your plan to have guaranteed throughput even in times of extraordinary request traffic."}'}`);
          await delay(backoffTime); // 使用指数级增加等待时间
          continue;
        }
        
        // 获取的签名列表
        const signatures = signaturesData.result.map((item: any) => item.signature);
        
        // 批量获取交易详情
        const transactions: Transaction[] = [];
        
        logger.log(`获取到Solana交易签名列表，共${signatures.length}个交易`);
        logger.debug(`获取到签名列表 - 数量: ${signatures.length}, 第一个签名: ${signatures[0]}`);

        // 由于可能有大量交易，我们分批获取详情
        const batchSize = 3; // 减少批处理大小以防止触发限流
        for (let i = 0; i < Math.min(signatures.length, limit); i += batchSize) {
          const batch = signatures.slice(i, i + batchSize);
          
          logger.log(`获取Solana交易详情批次 ${i / batchSize + 1}，共${batch.length}个交易`);
          logger.debug(`开始批次 ${i / batchSize + 1} - 批次大小: ${batch.length}, 起始索引: ${i}`);
          
          // 在处理批次之前增加延迟，降低请求频率
          await delay(1000 + Math.random() * 1000);
          
          // 处理批次中的每个签名
          for (const signature of batch) {
            logger.debug(`处理签名: ${signature.substring(0, 16)}...`);
            // 获取每个交易的详情
            let txDetails;
            retryCount = 0;
            
            while (retryCount <= maxRetries) {
              try {
                // 每次处理新交易前增加较长延迟，避免连续快速请求
                if (retryCount === 0) {
                  await delay(1500 + Math.random() * 1500);
                }
                
                logger.debug(`发送getTransaction请求 - 签名: ${signature.substring(0, 16)}..., 尝试 #${retryCount + 1}`);
                const txDetailsResponse = await fetch(baseUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'getTransaction',
                    params: [
                      signature,
                      {
                        encoding: "jsonParsed",
                        maxSupportedTransactionVersion: 0
                      }
                    ]
                  }),
                });

                txDetails = await txDetailsResponse.json();
                logger.debug(`收到交易详情响应 - 状态码: ${txDetailsResponse.status}, 数据大小: ${JSON.stringify(txDetails).length.toLocaleString()} 字节`);
                
                // 记录API使用情况，即使请求成功
                logApiUsage(txDetailsResponse, 'Solana-Transaction');
                
                // 如果没有错误或者错误不是限流相关，跳出重试循环
                if (txDetailsResponse.status === 429 || (txDetails.error && txDetails.error.code === 429)) {
                  logRateLimitInfo(txDetailsResponse, txDetails, 'Solana-Transaction');
                  retryCount++;
                  const backoffTime = exponentialBackoff(retryCount);
                  logger.log(`遇到API限流错误(429)，第 ${retryCount} 次重试，等待 ${backoffTime/1000} 秒...`);
                  logger.debug(`交易详情限流 - 错误码: ${txDetails.error?.code}, 消息: ${txDetails.error?.message}`);
                  logger.error(`获取Solana签名失败: \n{code: ${txDetails.error?.code}, message: '${txDetails.error?.message || "Your app has been rate-limited due to unusually high global traffic. Consider upgrading your plan to have guaranteed throughput even in times of extraordinary request traffic."}'}`);
                  await delay(backoffTime);
                  continue;
                }
                
                logger.log(`获取到交易详情 [${signature}]:`);
                
                // 处理每个交易
                if (!txDetails.error && txDetails.result) {
                  try {
                    const tx = txDetails.result;
                    logger.debug(`交易详情有效 - 签名: ${signature.substring(0, 16)}..., 区块时间: ${tx.blockTime}`);
                    
                    // 检查是否存在meta和postTokenBalances
                    if (!tx.meta || !tx.meta.postTokenBalances || !tx.meta.preTokenBalances) {
                      logger.log(`跳过交易 [${signature}]: 缺少token余额信息`);
                      logger.debug(`缺少Token余额 - meta存在: ${!!tx.meta}, postTokenBalances存在: ${!!tx.meta?.postTokenBalances}, preTokenBalances存在: ${!!tx.meta?.preTokenBalances}`);
                      continue;
                    }

                    // Log transaction structure for debugging
                    logger.debug(`交易结构 - meta字段:`, Object.keys(tx.meta));
                    logger.debug(`交易结构 - transaction字段:`, Object.keys(tx.transaction));
                    logger.debug(`交易结构 - transaction.message字段:`, Object.keys(tx.transaction.message));
                    
                    // 当前我们只关注USDC和USDT交易
                    const tokenBalances = tx.meta.postTokenBalances;
                    const preTokenBalances = tx.meta.preTokenBalances;
                    logger.log(`交易 [${signature}] token数量: ${tokenBalances.length}`);
                    logger.debug(`Token余额 - Post余额数: ${tokenBalances.length}, Pre余额数: ${preTokenBalances.length}`);
                    
                    // 检查是否有USDC或USDT token
                    let isStablecoinTx = false;
                    let amount = 0;
                    let direction = 'in' as 'in' | 'out'; // 默认方向
                    let stablecoinType = '';
                    
                    for (const balance of tokenBalances) {
                      const mintAddress = balance.mint;
                      logger.log(`检查token: ${mintAddress}`);
                      logger.debug(`检查Token - Mint地址: ${mintAddress}, 账户索引: ${balance.accountIndex}`);
                      
                      // USDC和USDT在Solana上的Mint地址
                      if (mintAddress === STABLECOIN_CONTRACTS.SOLANA.USDC || mintAddress === STABLECOIN_CONTRACTS.SOLANA.USDT) {
                        isStablecoinTx = true;
                        stablecoinType = mintAddress === STABLECOIN_CONTRACTS.SOLANA.USDC ? 'USDC' : 'USDT';
                        logger.log(`找到稳定币交易: ${stablecoinType}`);
                        logger.debug(`找到稳定币 - 类型: ${stablecoinType}, Mint地址: ${mintAddress}`);
                        
                        // 找到对应的preTokenBalance
                        const preBalance = preTokenBalances.find(
                          (pre: { accountIndex: number; uiTokenAmount?: { amount: string; decimals: number } }) => pre.accountIndex === balance.accountIndex
                        );
                        
                        if (preBalance) {
                          const preAmount = parseInt(preBalance.uiTokenAmount?.amount || '0');
                          const postAmount = parseInt(balance.uiTokenAmount?.amount || '0');
                          const decimals = balance.uiTokenAmount?.decimals || 6;
                          logger.log(`预余额: ${preAmount}, 后余额: ${postAmount}`);
                          logger.debug(`余额比较 - 预余额: ${preAmount}, 后余额: ${postAmount}, 小数位: ${decimals}`);
                          
                          // 计算金额变化并确定方向
                          const delta = postAmount - preAmount;
                          logger.debug(`计算余额差额 - 差额: ${delta}, 原始值`);
                          
                          if (delta > 0) {
                            amount = delta / (10 ** decimals);
                            direction = 'in';
                            logger.log(`收到金额: ${amount}`);
                            logger.debug(`收到金额 - 金额: ${amount}, 原始Delta: ${delta}, 小数位: ${decimals}`);
                          } else if (delta < 0) {
                            amount = Math.abs(delta) / (10 ** decimals);
                            direction = 'out';
                            logger.log(`发送金额: ${amount}`);
                            logger.debug(`发送金额 - 金额: ${amount}, 原始Delta: ${delta}, 小数位: ${decimals}`);
                          } else {
                            logger.debug(`余额无变化 - Delta: ${delta}`);
                          }
                        } else {
                          logger.debug(`未找到匹配的预余额 - 账户索引: ${balance.accountIndex}`);
                        }
                        break; // 找到一个稳定币交易就跳出
                      }
                    }
                    
                    if (isStablecoinTx && amount > 0) {
                      const scaledAmount = Math.round(amount * 1000000).toString();
                      logger.log(`添加有效交易 [${signature}]: 方向=${direction}, 金额=${amount}, 转换后金额=${scaledAmount}`);
                      logger.debug(`添加交易 - 签名: ${signature.substring(0, 16)}..., 类型: ${stablecoinType}, 方向: ${direction}, 原始金额: ${amount}, 格式化金额: ${scaledAmount}`);
                      
                      // Determine the transaction addresses correctly based on direction
                      let fromAddress = '';
                      let toAddress = '';
                      
                      // Log all account keys in the transaction for debugging
                      logger.debug(`交易账户列表 - 总账户数: ${tx.transaction.message.accountKeys.length}`);
                      tx.transaction.message.accountKeys.forEach((account: { pubkey: string; signer: boolean; writable: boolean }, index: number) => {
                        logger.debug(`账户[${index}]: ${account.pubkey}, 是否签名者: ${account.signer}, 是否可写: ${account.writable}`);
                      });
                      
                      // Find the token program accounts
                      const tokenAccounts = tx.meta.postTokenBalances.map((balance: any) => {
                        const accountInfo = tx.transaction.message.accountKeys[balance.accountIndex];
                        return {
                          pubkey: accountInfo.pubkey,
                          accountIndex: balance.accountIndex,
                          signer: accountInfo.signer,
                          writable: accountInfo.writable,
                          owner: balance.owner || (balance.uiTokenAmount?.owner) || null
                        };
                      });
                      
                      logger.debug(`Token账户列表 - 总数: ${tokenAccounts.length}`);
                      tokenAccounts.forEach((account: any, index: number) => {
                        logger.debug(`Token账户[${index}]: ${account.pubkey}, 索引: ${account.accountIndex}, 所有者: ${account.owner || '未知'}`);
                        // Log more details about each token balance for debugging
                        const originalBalance = tx.meta.postTokenBalances[index];
                        logger.debug(`原始Token余额[${index}]:`, originalBalance);
                      });
                      
                      // Check for token instructions to find counterparty
                      let counterpartyFromInstruction = null;
                      if (tx.transaction.message.instructions) {
                        logger.debug(`指令列表 - 总数: ${tx.transaction.message.instructions.length}`);
                        
                        // Look through transaction instructions for token transfers
                        tx.transaction.message.instructions.forEach((instruction: any, idx: number) => {
                          logger.debug(`指令[${idx}] 程序ID:`, instruction.programId);
                          
                          // Check if this is a token program instruction (transfers, etc)
                          if (instruction.parsed && instruction.parsed.type === 'transfer') {
                            logger.debug(`发现Token转账指令:`, instruction.parsed);
                            
                            if (instruction.parsed.info) {
                              const info = instruction.parsed.info;
                              if (direction === 'in' && info.source && info.source !== walletAddress) {
                                counterpartyFromInstruction = info.source;
                                logger.debug(`从指令中找到发送方: ${counterpartyFromInstruction}`);
                              } else if (direction === 'out' && info.destination && info.destination !== walletAddress) {
                                counterpartyFromInstruction = info.destination;
                                logger.debug(`从指令中找到接收方: ${counterpartyFromInstruction}`);
                              }
                            }
                          }
                        });
                      }
                      
                      // In Solana, transactions can be complex, but for token transfers:
                      // For incoming: Try to find a token account not owned by the user
                      // For outgoing: Try to find a token account not owned by the user
                      
                      if (direction === 'in') {
                        // For incoming, the "from" should be the counterparty
                        // First try using the instruction data if available
                        if (counterpartyFromInstruction) {
                          fromAddress = counterpartyFromInstruction;
                          logger.debug(`使用指令中的转入方地址: ${fromAddress}`);
                        } else {
                          // Look for a token account not owned by the wallet address
                          const counterpartyAccount = tokenAccounts.find((acct: any) => 
                            acct.owner && acct.owner !== walletAddress && acct.pubkey !== walletAddress
                          );
                          
                          if (counterpartyAccount && counterpartyAccount.owner) {
                            fromAddress = counterpartyAccount.owner;
                            logger.debug(`找到转入方地址: ${fromAddress}`);
                          } else {
                            // Fallback: Use the first signer that isn't the wallet address
                            const firstNonWalletSigner = tx.transaction.message.accountKeys.find(
                              (acct: { pubkey: string; signer: boolean; writable: boolean }) => acct.signer && acct.pubkey !== walletAddress
                            );
                            
                            fromAddress = firstNonWalletSigner ? firstNonWalletSigner.pubkey : tx.transaction.message.accountKeys[0].pubkey;
                            logger.debug(`使用备选转入方地址: ${fromAddress}`);
                          }
                        }
                        
                        toAddress = walletAddress;
                        logger.debug(`收款交易 - FROM=${fromAddress} TO=${toAddress}`);
                      } else {
                        // For outgoing, the "to" should be the counterparty
                        // First try using the instruction data if available
                        if (counterpartyFromInstruction) {
                          toAddress = counterpartyFromInstruction;
                          logger.debug(`使用指令中的转出方地址: ${toAddress}`);
                        } else {
                          // Look for a token account not owned by the wallet address
                          const counterpartyAccount = tokenAccounts.find((acct: any) => 
                            acct.owner && acct.owner !== walletAddress && acct.pubkey !== walletAddress
                          );
                          
                          if (counterpartyAccount && counterpartyAccount.owner) {
                            toAddress = counterpartyAccount.owner;
                            logger.debug(`找到转出方地址: ${toAddress}`);
                          } else {
                            // Fallback: use a writable account that isn't the wallet address
                            const firstNonWalletWritable = tx.transaction.message.accountKeys.find(
                              (acct: { pubkey: string; signer: boolean; writable: boolean }) => acct.writable && acct.pubkey !== walletAddress
                            );
                            
                            toAddress = firstNonWalletWritable ? firstNonWalletWritable.pubkey : tx.transaction.message.accountKeys[0].pubkey;
                            logger.debug(`使用备选转出方地址: ${toAddress}`);
                          }
                        }
                        
                        fromAddress = walletAddress;
                        logger.debug(`付款交易 - FROM=${fromAddress} TO=${toAddress}`);
                      }
                      
                      transactions.push({
                        timestamp: new Date(tx.blockTime * 1000).getTime() / 1000,
                        hash: signature,
                        from: fromAddress,
                        to: toAddress,
                        amount: scaledAmount, // 转换为6位小数格式 (乘以10^6)，与以太坊交易格式保持一致
                        direction: direction as 'in' | 'out',
                        formattedDate: new Date(tx.blockTime * 1000).toLocaleDateString(),
                        coin: stablecoinType || 'USDC',
                        chain: 'solana'
                      });
                    } else {
                      logger.log(`跳过交易 [${signature}]: 非稳定币交易或金额为0`);
                      logger.debug(`跳过交易 - 是稳定币: ${isStablecoinTx}, 金额: ${amount}, 签名: ${signature.substring(0, 16)}...`);
                    }
                  } catch (err) {
                    logger.error(`解析Solana交易 [${signature}] 失败:`, err);
                    logger.debug(`解析交易失败 - 签名: ${signature.substring(0, 16)}..., 错误: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
                  }
                } else {
                  logger.error(`获取交易 [${signature}] 详情失败:`, txDetails.error);
                  logger.debug(`交易详情无效 - 签名: ${signature.substring(0, 16)}..., 错误: ${txDetails.error ? JSON.stringify(txDetails.error) : '未知错误'}`);
                }
                
                // 成功获取交易详情后跳出重试循环
                break;
              } catch (txError) {
                logger.error(`获取交易 [${signature}] 详情时出错:`, txError);
                logger.debug(`交易详情请求错误 - 签名: ${signature.substring(0, 16)}..., 错误: ${txError instanceof Error ? txError.message : JSON.stringify(txError)}`);
                
                // 如果已达到最大重试次数，跳过此交易
                if (retryCount >= maxRetries) {
                  logger.log(`已达到最大重试次数 (${maxRetries})，跳过交易 [${signature}]`);
                  break;
                }
                
                retryCount++;
                const backoffTime = exponentialBackoff(retryCount);
                logger.log(`获取交易详情失败，第 ${retryCount} 次重试，等待 ${backoffTime/1000} 秒...`);
                await delay(backoffTime);
              }
            } // 结束getTransaction的重试循环
          } // 结束批次中每个签名的处理
        } // 结束批次处理
        
        logger.log(`处理完成，找到${transactions.length}个有效稳定币交易`);
        logger.debug(`处理完成 - 找到交易数: ${transactions.length}, 查询的签名总数: ${signatures.length}`);
        
        // 按时间排序
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        logger.debug(`交易已排序 - 最早交易时间: ${new Date(transactions[transactions.length-1]?.timestamp * 1000).toISOString()}, 最新交易时间: ${new Date(transactions[0]?.timestamp * 1000).toISOString()}`);
        
        // 如果没有找到交易，返回空数组
        if (transactions.length === 0) {
          logger.log("未找到Solana稳定币交易");
          logger.debug(`未找到交易 - 返回空数组`);
          return [];
        }
        
        logger.log(`总共找到 ${transactions.length} 条有效的Solana稳定币交易`);
        logger.debug(`返回交易 - 总数: ${transactions.length}, 钱包地址: ${walletAddress}`);
        
        return transactions;
      } catch (error) {
        logger.error('获取Solana交易失败:', error);
        logger.debug(`获取交易异常 - 错误: ${error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error)}`);
        
        // 如果已达到最大重试次数，返回空数组
        if (retryCount >= maxRetries) {
          logger.log(`获取签名已达到最大重试次数 (${maxRetries})`);
          return [];
        }
        
        retryCount++;
        const backoffTime = exponentialBackoff(retryCount);
        logger.log(`获取Solana交易签名失败，第 ${retryCount} 次重试，等待 ${backoffTime/1000} 秒...`);
        await delay(backoffTime);
      }
    }
    
    // 如果所有重试都失败，返回空数组
    logger.log('所有重试获取Solana交易签名都失败');
    return [];
  } catch (error) {
    logger.error('获取Solana交易失败:', error);
    logger.debug(`获取交易异常 - 错误: ${error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error)}`);
    // 出错时返回空数组
    return [];
  }
}

// Add a function to log rate limit info
const logRateLimitInfo = (response: Response, errorData: any, apiType: string): void => {
  logger.warn(`[RATE_LIMIT] ${apiType} API 遇到限流 (429)`, {
    timestamp: new Date().toISOString(),
    headers: {
      'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
      'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
      'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
      'retry-after': response.headers.get('retry-after')
    },
    status: response.status,
    statusText: response.statusText,
    errorCode: errorData?.error?.code,
    errorMessage: errorData?.error?.message
  });
  
  // 计算并显示重置时间
  const resetTime = response.headers.get('x-ratelimit-reset');
  if (resetTime) {
    try {
      const resetTimestamp = parseInt(resetTime, 10) * 1000; // 通常是Unix时间戳（秒）
      const resetDate = new Date(resetTimestamp);
      const nowDate = new Date();
      const waitTimeMs = resetTimestamp - nowDate.getTime();
      
      if (waitTimeMs > 0) {
        const waitTimeSec = Math.ceil(waitTimeMs / 1000);
        logger.log(`[RATE_LIMIT] 限流重置时间: ${resetDate.toLocaleTimeString()}, 还需等待约 ${waitTimeSec} 秒`);
      } else {
        logger.warn(`[RATE_LIMIT] 限流应该已经重置，但仍然收到429错误，可能是其他原因`);
      }
    } catch (e) {
      logger.error(`[RATE_LIMIT] 无法解析重置时间: ${resetTime}, 错误: ${e}`);
    }
  } else {
    // 如果没有提供重置时间，使用retry-after
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) {
      const waitTimeSec = parseInt(retryAfter, 10);
      logger.log(`[RATE_LIMIT] 根据Retry-After头，需要等待 ${waitTimeSec} 秒后重试`);
    } else {
      logger.warn(`[RATE_LIMIT] 没有重置时间信息，建议采用指数退避策略`);
    }
  }
  
  // 记录当前请求计数情况
  const rateLimit = response.headers.get('x-ratelimit-limit');
  const remaining = response.headers.get('x-ratelimit-remaining');
  if (rateLimit && remaining) {
    const used = parseInt(rateLimit) - parseInt(remaining);
    const usedPercent = (used / parseInt(rateLimit) * 100).toFixed(1);
    logger.log(`[RATE_LIMIT] API使用情况: ${used}/${rateLimit} (${usedPercent}%)`);
  }
}; 