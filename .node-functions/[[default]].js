import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

// 1. 因为你的旧代码用的是 require，这里创建一个兼容层
const require = createRequire(import.meta.url);

// 2. 引入原来的核心逻辑
const { serveNcmApi } = require('../server.js');
const generateConfig = require('../generateConfig.js');

// 3. 处理临时文件 (照搬原 app.js 的逻辑)
const tmpPath = os.tmpdir();
const tokenPath = path.resolve(tmpPath, 'anonymous_token');
if (!fs.existsSync(tokenPath)) {
  fs.writeFileSync(tokenPath, '', 'utf-8');
}

// 4. 生成配置 (防止报错影响启动，加个 try-catch)
try {
  await generateConfig();
} catch (e) {
  console.error("Config skipped:", e);
}

// 5. 【关键】获取 app 实例，并开启 skipListen 禁止监听端口
const app = await serveNcmApi({
  checkVersion: false, // 关掉版本检查，加快启动
  skipListen: true     // ✅ 告诉 server.js 不要监听端口！
});

// 6. 导出给 EdgeOne
export default app;