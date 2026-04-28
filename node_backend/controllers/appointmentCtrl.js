const { dbMain, sequelizeMain } = require('../models');
const { QueryTypes } = require('sequelize');

const bookAppointment = async (req, res) => {
    const { doctor_id, start_time, disease } = req.body;
    const patient_id = req.user.id;

    if (!doctor_id || !start_time || !disease) {
        return res.status(400).json({ error: 'doctor_id, start_time, and disease are required' });
    }

    // Core Requirement: Prevent race conditions using transactions
    const t = await sequelizeMain.transaction();

    try {
        // Validate inputs
        const targetTime = new Date(start_time);
        if (isNaN(targetTime.getTime())) {
            throw new Error('Invalid start_time format');
        }

        // Lock doctor row to prevent concurrent Phantom Reads (double-booking race condition)
        await sequelizeMain.query(
            `SELECT id FROM users WHERE id = :doctorId FOR UPDATE;`, 
            { replacements: { doctorId: doctor_id }, type: QueryTypes.SELECT, transaction: t }
        );

        // Core Requirement: Proper Overlap Check (A_start < B_end AND A_end > B_start)
        const conflictingAppts = await sequelizeMain.query(
            `SELECT id FROM appointments 
             WHERE doctor_id = :doctorId 
             AND start_time < DATE_ADD(:requestTime, INTERVAL 15 MINUTE)
             AND DATE_ADD(start_time, INTERVAL duration MINUTE) > :requestTime
             FOR UPDATE;`, 
            {
                replacements: { doctorId: doctor_id, requestTime: targetTime.toISOString().slice(0, 19).replace('T', ' ') },
                type: QueryTypes.SELECT,
                transaction: t
            }
        );

        if (conflictingAppts.length > 0) {
            await t.rollback();
            return res.status(409).json({ 
                error: 'Conflict: Slot already booked within 15 minutes of requested time.' 
            });
        }

        // No conflict, proceed with booking
        const newAppointment = await dbMain.Appointment.create({
            patient_id,
            doctor_id,
            start_time: targetTime,
            disease,
            duration: 15 // Strict 15 min slots
        }, { transaction: t });

        await t.commit();
        return res.status(201).json({ 
            message: 'Appointment booked successfully', 
            appointment: newAppointment 
        });

    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: error.message });
    }
};

const deleteAppointment = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only.' });
        
        const { source, id } = req.params;
        if (source === 'main') {
            const num = await dbMain.Appointment.destroy({ where: { id } });
            if (num === 0) throw new Error("Appointment not found in Main DB");
        } else if (source === 'archive') {
            const { dbArchive } = require('../models');
            const num = await dbArchive.Appointment.destroy({ where: { id } });
            if (num === 0) throw new Error("Appointment not found in Archive DB");
        }
        res.json({ message: 'Appointment deleted successfully and slot freed.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateAppointment = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admins only.' });
        
        const { source, id } = req.params;
        const { doctor_id, start_time, disease } = req.body;
        
        const targetTime = new Date(start_time);
        if (isNaN(targetTime.getTime())) return res.status(400).json({ error: 'Invalid start_time format' });

        const { dbArchive } = require('../models');

        // Determine destination based on date
        const today = new Date();
        today.setHours(0,0,0,0);
        const belongsToMain = targetTime >= today;

        if (source === 'main') {
            const t = await sequelizeMain.transaction();
            try {
                // Lock doctor row
                await sequelizeMain.query(
                    `SELECT id FROM users WHERE id = :doctorId FOR UPDATE;`, 
                    { replacements: { doctorId: doctor_id }, type: QueryTypes.SELECT, transaction: t }
                );

                // Conflict check with proper overlap mapping
                const conflictingAppts = await sequelizeMain.query(
                    `SELECT id FROM appointments 
                     WHERE doctor_id = :doctorId 
                     AND start_time < DATE_ADD(:requestTime, INTERVAL 15 MINUTE)
                     AND DATE_ADD(start_time, INTERVAL duration MINUTE) > :requestTime
                     AND id != :apptId
                     FOR UPDATE;`, 
                    {
                        replacements: { doctorId: doctor_id, requestTime: targetTime.toISOString().slice(0, 19).replace('T', ' '), apptId: id },
                        type: QueryTypes.SELECT,
                        transaction: t
                    }
                );

                if (conflictingAppts.length > 0) {
                    await t.rollback();
                    return res.status(409).json({ error: 'Conflict: The assigned doctor is already booked at that exact time.' });
                }

                if (!belongsToMain) {
                    // Move from Main to Archive
                    const oldAppt = await dbMain.Appointment.findOne({ where: { id }, transaction: t });
                    if (oldAppt) {
                        await dbArchive.Appointment.create({
                            id: oldAppt.id,
                            patient_id: oldAppt.patient_id,
                            doctor_id: doctor_id,
                            start_time: targetTime,
                            duration: oldAppt.duration,
                            disease,
                            created_at: oldAppt.created_at
                        });
                        await dbMain.Appointment.destroy({ where: { id }, transaction: t });
                    }
                } else {
                    // Standard update in Main
                    await dbMain.Appointment.update({ doctor_id, start_time: targetTime, disease }, { where: { id }, transaction: t });
                }
                await t.commit();
            } catch (innerErr) {
                await t.rollback();
                throw innerErr;
            }
        } else if (source === 'archive') {
            if (belongsToMain) {
                // Move from Archive to Main
                const oldAppt = await dbArchive.Appointment.findOne({ where: { id } });
                if (oldAppt) {
                    const t = await sequelizeMain.transaction();
                    try {
                        // Lock doctor row
                        await sequelizeMain.query(
                            `SELECT id FROM users WHERE id = :doctorId FOR UPDATE;`, 
                            { replacements: { doctorId: doctor_id }, type: QueryTypes.SELECT, transaction: t }
                        );

                        const conflictingAppts = await sequelizeMain.query(
                            `SELECT id FROM appointments 
                             WHERE doctor_id = :doctorId 
                             AND start_time < DATE_ADD(:requestTime, INTERVAL 15 MINUTE)
                             AND DATE_ADD(start_time, INTERVAL duration MINUTE) > :requestTime
                             FOR UPDATE;`, 
                            {
                                replacements: { doctorId: doctor_id, requestTime: targetTime.toISOString().slice(0, 19).replace('T', ' ') },
                                type: QueryTypes.SELECT,
                                transaction: t
                            }
                        );
                        if (conflictingAppts.length > 0) {
                            await t.rollback();
                            return res.status(409).json({ error: 'Conflict: The assigned doctor is already booked at that exact time in active records.' });
                        }
                        await dbMain.Appointment.create({
                            id: oldAppt.id,
                            patient_id: oldAppt.patient_id,
                            doctor_id: doctor_id,
                            start_time: targetTime,
                            duration: oldAppt.duration,
                            disease,
                            created_at: oldAppt.created_at
                        }, { transaction: t });
                        
                        await t.commit();
                        await dbArchive.Appointment.destroy({ where: { id } });
                    } catch (err) {
                        await t.rollback();
                        throw err;
                    }
                }
            } else {
                // Standard update in Archive
                await dbArchive.Appointment.update({ doctor_id, start_time: targetTime, disease }, { where: { id } });
            }
        }
        
        res.json({ message: 'Appointment updated successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { bookAppointment, deleteAppointment, updateAppointment };
