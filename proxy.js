/**
 * proxy.js — 本地 DeepSeek API 代理
 * 解决浏览器直调 API 的 CORS 问题
 * 运行：node proxy.js
 */

const http  = require('http');
const https = require('https');

const PORT = 3001;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    const rawBody = Buffer.concat(body);

    console.log('--- 收到请求 ---');
    console.log('路径:', req.url);
    console.log('Authorization 前20位:', (req.headers['authorization'] ?? '').slice(0, 20) + '...');

    const proxyReq = https.request({
      hostname: 'api.deepseek.com',
      path:     req.url,   // 透传路径，如 /chat/completions
      method:   'POST',
      headers: {
        'content-type':   'application/json',
        'authorization':  req.headers['authorization'] ?? '',
        'host':           'api.deepseek.com',
        'content-length': rawBody.length,
      },
    }, proxyRes => {
      console.log('DeepSeek 响应状态:', proxyRes.statusCode);

      const respChunks = [];
      proxyRes.on('data', c => respChunks.push(c));
      proxyRes.on('end', () => {
        const respBody = Buffer.concat(respChunks).toString();
        if (proxyRes.statusCode !== 200) {
          console.log('DeepSeek 错误响应:', respBody.slice(0, 300));
        }
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(respBody);
      });
    });

    proxyReq.on('error', err => {
      console.error('代理请求失败:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.write(rawBody);
    proxyReq.end();
  });

}).listen(PORT, () => {
  console.log(`✓ DeepSeek 代理已启动：http://localhost:${PORT}`);
  console.log('  保持此窗口开启，然后刷新浏览器即可使用 AI 功能');
});
