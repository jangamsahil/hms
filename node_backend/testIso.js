const { sequelizeMain } = require('./config/database');
const { QueryTypes } = require('sequelize');

const testOverlap = async () => {
    try {
        await sequelizeMain.authenticate();
        // The time they target
        const targetTime = new Date('2026-04-20T21:59:00'); 
        
        // Convert to UTC string matching MySQL DATETIME format
        const requestTime = targetTime.toISOString().slice(0, 19).replace('T', ' ');

        const q = await sequelizeMain.query(`
            SELECT id, start_time, duration FROM hms_main.appointments 
            WHERE doctor_id = 3
            AND start_time < DATE_ADD(:requestTime, INTERVAL 15 MINUTE)
            AND DATE_ADD(start_time, INTERVAL duration MINUTE) > :requestTime
        `, { replacements: { requestTime }, type: QueryTypes.SELECT });
        
        console.log("Found Overlaps with ISO-format:", q);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
testOverlap();
