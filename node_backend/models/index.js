const { sequelizeMain, sequelizeArchive } = require('../config/database');

const UserModel = require('./User');
const LoginLogModel = require('./LoginLog');
const AppointmentModel = require('./Appointment');

// Initialize models for Main DB
const dbMain = {
    User: UserModel(sequelizeMain),
    LoginLog: LoginLogModel(sequelizeMain),
    Appointment: AppointmentModel(sequelizeMain)
};

// Initialize models for Archive DB
const dbArchive = {
    User: UserModel(sequelizeArchive),
    LoginLog: LoginLogModel(sequelizeArchive),
    Appointment: AppointmentModel(sequelizeArchive)
};

// Relationships for MAIN DB
dbMain.User.hasMany(dbMain.LoginLog, { foreignKey: 'user_id' });
dbMain.LoginLog.belongsTo(dbMain.User, { foreignKey: 'user_id' });

dbMain.User.hasMany(dbMain.Appointment, { as: 'PatientAppointments', foreignKey: 'patient_id' });
dbMain.User.hasMany(dbMain.Appointment, { as: 'DoctorAppointments', foreignKey: 'doctor_id' });
dbMain.Appointment.belongsTo(dbMain.User, { as: 'Patient', foreignKey: 'patient_id' });
dbMain.Appointment.belongsTo(dbMain.User, { as: 'Doctor', foreignKey: 'doctor_id' });

// Relationships for ARCHIVE DB (Same structure)
dbArchive.User.hasMany(dbArchive.LoginLog, { foreignKey: 'user_id' });
dbArchive.LoginLog.belongsTo(dbArchive.User, { foreignKey: 'user_id' });

dbArchive.User.hasMany(dbArchive.Appointment, { as: 'PatientAppointments', foreignKey: 'patient_id' });
dbArchive.User.hasMany(dbArchive.Appointment, { as: 'DoctorAppointments', foreignKey: 'doctor_id' });
dbArchive.Appointment.belongsTo(dbArchive.User, { as: 'Patient', foreignKey: 'patient_id' });
dbArchive.Appointment.belongsTo(dbArchive.User, { as: 'Doctor', foreignKey: 'doctor_id' });

module.exports = {
    sequelizeMain,
    sequelizeArchive,
    dbMain,
    dbArchive
};
