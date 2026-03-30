const http = require('http');

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Test server working' }));
});

server.listen(3002, '0.0.0.0', () => {
    console.log('Test server running on port 3002');
});

server.on('error', (err) => {
    console.error('Server error:', err);
});
