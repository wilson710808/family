const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// 初始化數據庫
require('./lib/db.ts');
const { initializeDatabase } = require('./lib/db.ts');
initializeDatabase();

// 導入 Socket.IO Manager
const { socketManager } = require('./lib/socket.ts');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3002', 10);

// 靜態文件目錄
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// MIME 類型映射
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};


// HTTPS 配置 - 當證書存在時啟用 HTTPS
let httpsOptions: { key: Buffer; cert: Buffer; ca?: Buffer } | null = null;
const sslKeyPath = process.env.SSL_KEY_PATH || './certs/private.key';
const sslCertPath = process.env.SSL_CERT_PATH || './certs/certificate.crt';
const sslCaPath = process.env.SSL_CA_PATH || './certs/ca-bundle.crt';

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  httpsOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };
  // 如果有 CA 證書鏈，也加上
  if (fs.existsSync(sslCaPath)) {
    httpsOptions.ca = fs.readFileSync(sslCaPath);
  }
  console.log('> HTTPS certificates found, enabling HTTPS');
} else {
  console.log('> HTTPS certificates not found, running in HTTP only');
  console.log(`> To enable HTTPS, place your certificates at:`);
  console.log(`>   - ${sslKeyPath}`);
  console.log(`>   - ${sslCertPath}`);
  console.log(`>   - ${sslCaPath} (optional)`);
}

// 初始化 Next.js
const app = next({ dev, hostname, port, turbopack: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const requestHandler = async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // 處理靜態文件請求 (uploads 目錄)
      if (parsedUrl.pathname?.startsWith('/uploads/')) {
        const filePath = path.join(UPLOADS_DIR, parsedUrl.pathname.replace('/uploads/', ''));
        
        // 檢查文件是否存在
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
          return;
        } else {
          res.statusCode = 404;
          res.end('File not found');
          return;
        }
      }
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  };

  let server;
  let protocol;

  if (httpsOptions) {
    // HTTPS 模式
    server = createHttpsServer(httpsOptions, requestHandler);
    protocol = 'https';
  } else {
    // HTTP 模式
    server = createServer(requestHandler);
    protocol = 'http';
  }

  // 初始化 Socket.IO
  socketManager.init(server);

  // 定期清理不活躍用戶
  setInterval(() => {
    socketManager.cleanupInactiveUsers();
  }, 60 * 1000); // 每分鐘檢查一次

  server
    .once('error', (err: any) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on ${protocol}://${hostname}:${port}`);
      console.log('> Socket.IO initialized ✓');
      console.log('> AI Gateway URL:', process.env.AI_GATEWAY_URL || 'https://www.herelai.fun/ws/05-ai-gateway/api/query');
    });
});
