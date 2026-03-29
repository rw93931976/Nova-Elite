const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    if (req.method === 'POST' && req.url === '/desktop-files') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('Desktop file request:', data.query);
                
                // Simple file listing
                exec('dir "C:\\Users\\Ray\\Desktop\\*.txt" /b', (error, stdout, stderr) => {
                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                        return;
                    }
                    
                    const files = stdout.trim().split('\n').filter(f => f.length > 0);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        count: files.length,
                        files: files 
                    }));
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Desktop bridge running on port 3000');
});
