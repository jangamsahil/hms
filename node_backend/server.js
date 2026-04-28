const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testDbConnections } = require('./config/database');
const authMiddleware = require('./middleware/auth');

// Controllers
const { register, login, logout } = require('./controllers/authController');
const { bookAppointment, deleteAppointment, updateAppointment } = require('./controllers/appointmentCtrl');
const { getAppointments, getDoctors, getAvailability, getUsers, deleteUser } = require('./controllers/dataController');

// Initialize Cron Job
require('./jobs/dailyArchive');

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Routes
// 1. Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', authMiddleware, logout);

// 2. Appointment Booking Route (Requires Login)
app.post('/api/appointments/book', authMiddleware, bookAppointment);

// 3. Information Retrieval (Main + Archive)
app.get('/api/appointments', authMiddleware, getAppointments);
app.get('/api/appointments/availability', authMiddleware, getAvailability);
app.get('/api/doctors', authMiddleware, getDoctors);
app.get('/api/users', authMiddleware, getUsers);
app.delete('/api/users/:id', authMiddleware, deleteUser);

// 4. Admin Management Controls
app.delete('/api/appointments/:source/:id', authMiddleware, deleteAppointment);
app.put('/api/appointments/:source/:id', authMiddleware, updateAppointment);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Test Database Multiple Connections (Main & Archive)
    await testDbConnections();
});
