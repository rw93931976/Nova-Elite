const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Express server working!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Express server running on port ${PORT}`);
    console.log(`🌐 Try: http://localhost:${PORT}`);
    console.log(`🌐 Try: http://127.0.0.1:${PORT}`);
});
