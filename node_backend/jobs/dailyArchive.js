const cron = require('node-cron');
const { sequelizeMain } = require('../models');

// Configure cron to run at 00:00 (Midnight) every day
cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Starting daily data migration/archiving...');

    const t = await sequelizeMain.transaction();

    try {
        console.log('[CRON] Archiving appointments...');
        // Using raw queries as it acts across databases natively in MySQL
        await sequelizeMain.query(`
            INSERT INTO hms_archive.appointments (id, patient_id, doctor_id, start_time, duration, disease, created_at)
            SELECT id, patient_id, doctor_id, start_time, duration, disease, created_at
            FROM hms_main.appointments
            WHERE DATE(start_time) < CURRENT_DATE;
        `, { transaction: t });

        await sequelizeMain.query(`
            DELETE FROM hms_main.appointments
            WHERE DATE(start_time) < CURRENT_DATE;
        `, { transaction: t });

        console.log('[CRON] Archiving login logs...');
        await sequelizeMain.query(`
            INSERT INTO hms_archive.login_logs (id, user_id, login_time, logout_time, role)
            SELECT id, user_id, login_time, logout_time, role
            FROM hms_main.login_logs
            WHERE DATE(login_time) < CURRENT_DATE;
        `, { transaction: t });

        await sequelizeMain.query(`
            DELETE FROM hms_main.login_logs
            WHERE DATE(login_time) < CURRENT_DATE;
        `, { transaction: t });

        // Optional User archival handling if keeping users synced
        await sequelizeMain.query(`
            INSERT IGNORE INTO hms_archive.users (id, name, email, password, role, specialty, created_at)
            SELECT id, name, email, password, role, specialty, created_at
            FROM hms_main.users;
        `, { transaction: t });

        await t.commit();
        console.log('[CRON] Daily archiving completed successfully.');

    } catch (error) {
        await t.rollback();
        console.error('[CRON] Error during daily archiving:', error.message);
    }
});
