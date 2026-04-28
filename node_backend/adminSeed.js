require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        console.log('🔗 Connecting to DB...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME_MAIN || 'hms_main'
        });

        const hashedPassword = await bcrypt.hash('ADMIN123#', 10);

        // Check if admin already exists
        const [rows] = await connection.query(`SELECT id FROM users WHERE email = 'admin1@gmail.com'`);
        
        if (rows.length === 0) {
            await connection.query(`
                INSERT INTO users (name, email, password, role)
                VALUES ('System Administrator', 'admin1@gmail.com', ?, 'Admin')
            `, [hashedPassword]);
            console.log('✅ Admin account admin1@gmail.com generated successfully!');
        } else {
            // Update password just in case they tried to register it manually before
            await connection.query(`
                UPDATE users SET password = ?, role = 'Admin' WHERE email = 'admin1@gmail.com'
            `, [hashedPassword]);
            console.log('✅ Admin account exists - Password force synced to ADMIN123#');
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

seedAdmin();
