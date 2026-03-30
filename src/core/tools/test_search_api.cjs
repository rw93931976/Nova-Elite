const fetch = require('node-fetch');

async function testSearch() {
    const root = 'C:/Users/Ray/Desktop';
    const query = 'Nova';
    const url = `http://localhost:3505/api/file/search?path=${encodeURIComponent(root)}&query=${encodeURIComponent(query)}&type=name`;

    console.log(`Testing Deep Search: ${url}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Results:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Search failed:', e);
    }
}

testSearch();
