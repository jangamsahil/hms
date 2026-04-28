require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Helper: add a column only if it doesn't exist (compatible with all MySQL versions)
async function addColumnIfMissing(conn, dbName, tableName, columnName, columnDef) {
    const [rows] = await conn.query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [dbName, tableName, columnName]
    );
    if (rows[0].cnt === 0) {
        await conn.query(`ALTER TABLE ${dbName}.${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`  ✅ Added column: ${dbName}.${tableName}.${columnName}`);
    } else {
        console.log(`  ✔  Column exists: ${dbName}.${tableName}.${columnName}`);
    }
}

async function seedDoctors() {
    let connection;
    try {
        console.log('🔗 Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME_MAIN || 'hms_main',
            multipleStatements: true
        });

        // Step 1: Add specialty column to users in both DBs
        console.log('🔧 Checking specialty column...');
        await addColumnIfMissing(connection, 'hms_main',    'users', 'specialty', 'VARCHAR(100) NULL DEFAULT NULL');
        await addColumnIfMissing(connection, 'hms_archive', 'users', 'specialty', 'VARCHAR(100) NULL DEFAULT NULL');

        // Step 2: Add disease column to appointments in both DBs
        console.log('🔧 Checking disease column...');
        await addColumnIfMissing(connection, 'hms_main',    'appointments', 'disease', 'VARCHAR(255) NULL DEFAULT NULL');
        await addColumnIfMissing(connection, 'hms_archive', 'appointments', 'disease', 'VARCHAR(255) NULL DEFAULT NULL');
        console.log('✅ Schema migration complete.');

        // Step 4: Seed sample doctors
        console.log('\n👨‍⚕️ Seeding doctors...');
        const doctorsToSeed = [
            { name: 'Dr. Anil Sharma',   email: 'dr.sharma@hms.com',   specialty: 'Cardiology' },
            { name: 'Dr. Priya Verma',   email: 'dr.verma@hms.com',    specialty: 'Neurology' },
            { name: 'Dr. Kiran Mehta',   email: 'dr.kiran@hms.com',    specialty: 'Orthopedics' },
            { name: 'Dr. Ravi Kumar',    email: 'dr.ravi@hms.com',     specialty: 'Dermatology' },
            { name: 'Dr. Sunita Patel',  email: 'dr.sunita@hms.com',   specialty: 'Pediatrics' },
            { name: 'Dr. Mahesh Gupta',  email: 'dr.mahesh@hms.com',   specialty: 'Ophthalmology' },
        ];

        const defaultPassword = await bcrypt.hash('doctor123', 10);
        let added = 0;

        for (const doc of doctorsToSeed) {
            const [rows] = await connection.query(`SELECT id FROM hms_main.users WHERE email = ?`, [doc.email]);
            if (rows.length === 0) {
                await connection.query(
                    `INSERT INTO hms_main.users (name, email, password, role, specialty) VALUES (?, ?, ?, 'Doctor', ?)`,
                    [doc.name, doc.email, defaultPassword, doc.specialty]
                );
                console.log(`  ➕ Added: ${doc.name} (${doc.specialty})`);
                added++;
            } else {
                await connection.query(
                    `UPDATE hms_main.users SET specialty = ?, role = 'Doctor' WHERE email = ?`,
                    [doc.specialty, doc.email]
                );
                console.log(`  ✔  Exists: ${doc.name} — specialty synced`);
            }
        }

        console.log(`\n🎉 Done! ${added} new doctor(s) added.`);
        console.log(`🩺 Booking dropdown will now show ${doctorsToSeed.length} doctors.`);
        console.log(`🔑 All doctor login password: doctor123`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

seedDoctors();
