const https = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;

const app = next({ dev });
const handle = app.getRequestHandler();

// Check if certificates exist
const certPath = path.join(process.cwd(), 'certs', 'cert.pem');
const keyPath = path.join(process.cwd(), 'certs', 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('⚠️  HTTPS certificates not found. Please run ./setup-https.sh first');
    process.exit(1);
}

const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
    const server = https.createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    server.listen(httpsPort, (err) => {
        if (err) throw err;
        console.log(`🔐 HTTPS Server running on https://localhost:${httpsPort}`);
        console.log(`📱 Access from other devices: https://[your-rpi-ip]:${httpsPort}`);
        console.log(`📸 Camera will work on HTTPS!`);
    });
});