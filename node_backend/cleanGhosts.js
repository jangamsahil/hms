const { sequelizeMain } = require('./config/database');

const cleanGhosts = async () => {
    try {
        await sequelizeMain.authenticate();
        // Delete any appointment that started within 14 minutes of an older appointment
        await sequelizeMain.query(`
            DELETE a1 FROM hms_main.appointments a1
            JOIN hms_main.appointments a2 
            ON a1.doctor_id = a2.doctor_id 
            AND a1.id > a2.id 
            AND a1.start_time > a2.start_time 
            AND a1.start_time < DATE_ADD(a2.start_time, INTERVAL 15 MINUTE);
        `);
        console.log("Cleared Ghost Sequences.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
cleanGhosts();
