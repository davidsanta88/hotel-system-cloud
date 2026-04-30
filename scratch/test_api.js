const axios = require('axios');

async function testApi() {
    try {
        // We need a valid token. Since I don't have one, I can't test the protected route easily.
        // But I can check if the backend might be sending truncated IDs.
        console.log('Testing local API if running...');
        const res = await axios.get('http://localhost:5001/api/documentos-hotel');
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log('API not running or error:', err.message);
    }
}

testApi();
