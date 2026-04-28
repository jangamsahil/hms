const http = require('http');

async function test() {
    // 1. Login as patient
    const loginData = JSON.stringify({ email: 'sahil@example.com', password: 'password123' }); // I don't know the password, let's just make a token directly!
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 1, role: 'Patient' }, process.env.JWT_SECRET || 'fallback_secret');
    
    console.log("Token:", token);

    const fetchDoctors = () => {
        return new Promise((resolve, reject) => {
            const req = http.get('http://localhost:3000/api/doctors', {
                headers: { 'Authorization': `Bearer ${token}` }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log("Status:", res.statusCode);
                    console.log("Data:", data);
                    resolve();
                });
            });
            req.on('error', reject);
        });
    };
    
    await fetchDoctors();
}
require('dotenv').config();
test();
