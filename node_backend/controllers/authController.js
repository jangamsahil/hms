const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbMain } = require('../models');

const register = async (req, res) => {
    try {
        const { name, email, password, role, specialty } = req.body;
        
        // Basic validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        if (role === 'Admin') {
            return res.status(403).json({ error: 'System Administrator privileges cannot be registered publicly.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await dbMain.User.create({
            name,
            email,
            password: hashedPassword,
            role,
            specialty: role === 'Doctor' ? specialty : null
        });

        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Email already exists.' });
        }
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await dbMain.User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User is not registered' });
        }

        const passMatch = await bcrypt.compare(password, user.password);
        if (!passMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        // Core Requirement: Record login activity in main DB
        const loginLog = await dbMain.LoginLog.create({
            user_id: user.id,
            role: user.role
        });

        res.json({ 
            message: 'Login successful', 
            token, 
            logId: loginLog.id,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const { logId } = req.body;
        if (!logId) {
            return res.status(400).json({ error: 'Log ID is required for logout tracking.' });
        }

        // Core Requirement: Record logout activity
        await dbMain.LoginLog.update(
            { logout_time: new Date() },
            { where: { id: logId, user_id: req.user.id } }
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, logout };
