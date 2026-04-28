require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigrations() {
    try {
        console.log('🔗 Connecting to MySQL to run Data Migrations...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        // Add specialty to Users (Main & Archive)
        try {
            await connection.query("ALTER TABLE hms_main.users ADD COLUMN specialty VARCHAR(255) NULL;");
            await connection.query("ALTER TABLE hms_archive.users ADD COLUMN specialty VARCHAR(255) NULL;");
        } catch(e) {}

        // Add disease to Appointments (Main & Archive)
        try {
            await connection.query("ALTER TABLE hms_main.appointments ADD COLUMN disease VARCHAR(255) NULL;");
            await connection.query("ALTER TABLE hms_archive.appointments ADD COLUMN disease VARCHAR(255) NULL;");
        } catch(e) {}

        // Recreate the MySQL Event to include disease and specialty
        // We drop the old event and recreate the new logic to make sure `disease` transfers.
        await connection.query(`
            USE hms_main;
            DROP EVENT IF EXISTS daily_archive_event;
        `);

        await connection.query(`
            CREATE EVENT daily_archive_event
            ON SCHEDULE EVERY 1 DAY
            STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
            DO BEGIN
                DECLARE exit handler for sqlexception BEGIN ROLLBACK; END;
                START TRANSACTION;
                
                INSERT INTO hms_archive.appointments (id, patient_id, doctor_id, start_time, duration, disease, created_at)
                SELECT id, patient_id, doctor_id, start_time, duration, disease, created_at
                FROM hms_main.appointments WHERE DATE(created_at) < CURRENT_DATE;

                DELETE FROM hms_main.appointments WHERE DATE(created_at) < CURRENT_DATE;

                INSERT INTO hms_archive.login_logs (id, user_id, login_time, logout_time, role)
                SELECT id, user_id, login_time, logout_time, role
                FROM hms_main.login_logs WHERE DATE(login_time) < CURRENT_DATE;

                DELETE FROM hms_main.login_logs WHERE DATE(login_time) < CURRENT_DATE;

                INSERT IGNORE INTO hms_archive.users (id, name, email, password, role, specialty, created_at)
                SELECT id, name, email, password, role, specialty, created_at
                FROM hms_main.users;

                COMMIT;
            END;
        `);

        console.log('✅ Migrations completed successfully! DB schema upgraded.');
        await connection.end();
    } catch (error) {
        console.error('❌ Migration Error:', error.message);
    }
}

runMigrations();
