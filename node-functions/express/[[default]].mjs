import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

// 兼容层
const require = createRequire(import.meta.url);
const { serveNcmApi } = require('../../server.js');
const generateConfig = require('../../generateConfig.js');

// 1. 定义一个全局变量缓存 App 实例
// 这样只有第一次请求会初始化，后续请求会直接复用（热启动）
let appCache = null;

// 2. 封装初始化逻辑
async function getApp() {
  // 如果已经初始化过，直接返回
  if (appCache) return appCache;

  console.log('Initializing NCM API...');
  
  const tmpPath = os.tmpdir();
  const tokenPath = path.resolve(tmpPath, 'anonymous_token');
  
  // 写入临时 Token
  if (!fs.existsSync(tokenPath)) {
    fs.writeFileSync(tokenPath, '', 'utf-8');
  }

  // 生成配置
  try {
    await generateConfig();
  } catch (e) {
    console.error("Config generation skipped:", e);
  }

  // 获取 App 实例 (注意 skipListen: true)
  appCache = await serveNcmApi({
    checkVersion: false,
    skipListen: true 
  });

  return appCache;
}

// 3. 导出处理函数 (而不是直接导出 app)
// EdgeOne 会调用这个函数来处理请求
export default async (req, res) => {
  try {
    // 等待 App 初始化完成
    const app = await getApp();
    
    // 调用 Express 处理请求
    // Express 的 app 本身就是一个 (req, res) => ... 的函数
    app(req, res);
  } catch (err) {
    console.error('Function execution error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};