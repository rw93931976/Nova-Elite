// Simple test bridge
const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
    console.log('Request received:', req.method, req.url);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Simple bridge working!' }));
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Simple bridge running on port ${PORT}`);
    console.log(`🌐 Try: http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});
