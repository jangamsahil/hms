const { sequelizeMain } = require('./config/database');
const test = async () => {
  try {
    const users = await sequelizeMain.query("SELECT * FROM users WHERE name LIKE '%Dipti%'");
    console.log('Users:', users[0]);
    if(users[0].length > 0) {
      const appts = await sequelizeMain.query(`SELECT * FROM appointments WHERE patient_id=${users[0][0].id}`);
      console.log('Appts:', appts[0]);
    }
    process.exit();
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
};
test();
