const { sequelizeMain } = require('./models');
const { QueryTypes } = require('sequelize');

async function check() {
    try {
        const users = await sequelizeMain.query("SELECT * FROM hms_main.users", { type: QueryTypes.SELECT });
        console.log("Users:", users);

        const doctors = await sequelizeMain.query("SELECT id, name, specialty FROM hms_main.users WHERE role = 'Doctor'", { type: QueryTypes.SELECT });
        console.log("Doctors:", doctors);

        const appts = await sequelizeMain.query("SELECT * FROM hms_main.appointments", { type: QueryTypes.SELECT });
        console.log("Appointments:", appts);
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
check();
