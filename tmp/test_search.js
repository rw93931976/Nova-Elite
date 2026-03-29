import axios from 'axios';

async function testSearch() {
    const query = 'Nova'; // Testing search for "Nova"
    const root = 'C:/Users/Ray/Desktop';
    const url = `http://localhost:3505/api/file/search?path=${encodeURIComponent(root)}&query=${encodeURIComponent(query)}&type=name`;

    console.log(`🔍 Testing search API: ${url}`);
    try {
        const res = await axios.get(url);
        console.log('✅ API Response:', JSON.stringify(res.data, null, 2));
        if (res.data.results && res.data.results.length > 0) {
            console.log(`🎉 Found ${res.data.results.length} matches!`);
        } else {
            console.log('⚠️ No matches found (this might be normal if the desktop is clean).');
        }
    } catch (e) {
        console.error('❌ Search test failed:', e.message);
    }
}

testSearch();
