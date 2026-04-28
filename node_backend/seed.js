require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
    try {
        console.log('🔗 Connecting to MySQL to create databases...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            multipleStatements: true // Allow running the whole file at once
        });

        const sqlPath = path.join(__dirname, 'scripts', 'init_db.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Executing scripts/init_db.sql...');
        await connection.query(sqlQuery);

        console.log('✅ Databases and Tables created successfully!');
        
        await connection.end();
    } catch (error) {
        console.error('❌ Error creating databases:', error.message);
    }
}

seedDatabase();
