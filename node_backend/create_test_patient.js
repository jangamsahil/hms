const bcrypt = require('bcryptjs');
const { dbMain } = require('./models');

async function createTestPatient() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await dbMain.User.create({
            name: 'Test Patient',
            email: 'testpatient@example.com',
            password: hashedPassword,
            role: 'Patient',
            specialty: null
        });
        console.log("Test patient created.");
    } catch(e) {
        console.error(e.message);
    }
    process.exit();
}
createTestPatient();
