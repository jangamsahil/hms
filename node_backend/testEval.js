const { sequelizeMain } = require('./config/database');
const { QueryTypes } = require('sequelize');

const testOverlap = async () => {
    try {
        await sequelizeMain.authenticate();
        const requestTime = new Date('2026-04-20T21:59:00'); 
        
        const q = await sequelizeMain.query(`
            SELECT :requestTime as Req, DATE_ADD(:requestTime, INTERVAL 15 MINUTE) as Added
        `, { replacements: { requestTime }, type: QueryTypes.SELECT });
        
        console.log("Evaluation:", q);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
testOverlap();
