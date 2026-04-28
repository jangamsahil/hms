const { sequelizeMain } = require('./config/database');
const { QueryTypes } = require('sequelize');

const testOverlap = async () => {
    try {
        await sequelizeMain.authenticate();
        
        const q = await sequelizeMain.query(`
            SELECT id, start_time, duration FROM hms_main.appointments WHERE doctor_id = 3
        `, { type: QueryTypes.SELECT });
        
        console.log("All Appts:", q);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
testOverlap();
