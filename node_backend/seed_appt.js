const { dbMain } = require('./models');

async function seed() {
    try {
        const appointment = await dbMain.Appointment.create({
            patient_id: 13,
            doctor_id: 2,
            start_time: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours from now
            duration: 15,
            disease: 'Test Visibility'
        });
        console.log("Created appointment:", appointment.id);
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
seed();
