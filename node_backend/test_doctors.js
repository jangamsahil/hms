const { sequelizeMain } = require('./models');
const { QueryTypes } = require('sequelize');

async function test() {
    try {
        const users = await sequelizeMain.query(
            `SELECT id, name, role FROM hms_main.users`,
            { type: QueryTypes.SELECT }
        );
        console.log("Users in DB:", users);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
