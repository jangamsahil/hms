const { sequelizeMain, dbMain, dbArchive } = require('../models');
const { QueryTypes } = require('sequelize');

const getAppointments = async (req, res) => {
    try {
        const { date, doctor_id } = req.query;

        let query = ``;
        const replacements = {};

        const timeFadingClause = ``;

        const mainSelect = `SELECT a.id, a.patient_id, p.name AS patient_name, a.doctor_id, d.name AS doctor_name, a.start_time, a.duration, a.disease, a.created_at, 'main' as source FROM hms_main.appointments a LEFT JOIN hms_main.users p ON a.patient_id = p.id LEFT JOIN hms_main.users d ON a.doctor_id = d.id WHERE 1=1 ${timeFadingClause}`;
        
        const archiveSelect = `SELECT a.id, a.patient_id, p.name AS patient_name, a.doctor_id, d.name AS doctor_name, a.start_time, a.duration, a.disease, a.created_at, 'archive' as source FROM hms_archive.appointments a LEFT JOIN hms_archive.users p ON a.patient_id = p.id LEFT JOIN hms_archive.users d ON a.doctor_id = d.id WHERE 1=1 ${timeFadingClause}`;

        // Core Requirement: Data Retrieval System (Main vs Archive)
        if (date) {
            const queryDate = new Date(date);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            // If date is today or future -> query Main
            if (queryDate >= today) {
                query = `${mainSelect} AND DATE(a.start_time) = :date`;
            } 
            // If date is past -> query Archive
            else {
                query = `${archiveSelect} AND DATE(a.start_time) = :date`;
            }
            replacements.date = date;
        } 
        // If no date is given, or we need to bridge across past and future (e.g. all for a doctor)
        else if (doctor_id) {
            query = `
                ${mainSelect} AND a.doctor_id = :doctorId
                UNION ALL
                ${archiveSelect} AND a.doctor_id = :doctorId
                ORDER BY start_time DESC
            `;
            replacements.doctorId = doctor_id;
        } else {
            // Default: Fetch all unioned (limit applied for safety)
            query = `
                ${mainSelect}
                UNION ALL
                ${archiveSelect}
                ORDER BY start_time DESC
                LIMIT 1000
            `;
        }

        const appointments = await sequelizeMain.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        res.json({ appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDoctors = async (req, res) => {
    try {
        const doctors = await sequelizeMain.query(
            `SELECT id, name, specialty FROM hms_main.users WHERE role = 'Doctor'`,
            { type: QueryTypes.SELECT }
        );
        res.json({ doctors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAvailability = async (req, res) => {
    try {
        const { doctor_id, date } = req.query;
        if (!doctor_id || !date) return res.status(400).json({ error: 'doctor_id and date required' });

        const query = `
            SELECT start_time FROM hms_main.appointments 
            WHERE doctor_id = :doctorId AND DATE(start_time) = :date
            UNION ALL
            SELECT start_time FROM hms_archive.appointments 
            WHERE doctor_id = :doctorId AND DATE(start_time) = :date
        `;
        
        const booked = await sequelizeMain.query(query, {
            replacements: { doctorId: doctor_id, date },
            type: QueryTypes.SELECT
        });

        // Map to HH:MM format (local time to match UI)
        const bookedTimes = booked.map(b => {
             const d = new Date(b.start_time);
             return d.toTimeString().substring(0, 5);
        });

        res.json({ bookedTimes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const users = await sequelizeMain.query(
            `SELECT id, name, email, role, specialty, created_at FROM hms_main.users WHERE role != 'Admin' ORDER BY created_at DESC`,
            { type: QueryTypes.SELECT }
        );
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized. Only admins can delete users.' });
        }
        const { id } = req.params;

        const user = await dbMain.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.role === 'Admin') {
            return res.status(403).json({ error: 'Cannot delete an Admin.' });
        }

        // Wipe associated data (Login Logs)
        await dbMain.LoginLog.destroy({ where: { user_id: id } });
        await dbArchive.LoginLog.destroy({ where: { user_id: id } });

        // Wipe associated appointments (as patient or doctor)
        await dbMain.Appointment.destroy({ where: { patient_id: id } });
        await dbMain.Appointment.destroy({ where: { doctor_id: id } });
        await dbArchive.Appointment.destroy({ where: { patient_id: id } });
        await dbArchive.Appointment.destroy({ where: { doctor_id: id } });

        // Delete user from Archive and Main
        await dbArchive.User.destroy({ where: { id: id } });
        await user.destroy(); // from dbMain

        res.json({ message: 'User and related records deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAppointments, getDoctors, getAvailability, getUsers, deleteUser };
