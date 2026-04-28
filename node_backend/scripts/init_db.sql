-- Create Databases
CREATE DATABASE IF NOT EXISTS hms_main;
CREATE DATABASE IF NOT EXISTS hms_archive;

-- Use Main DB
USE hms_main;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Doctor', 'Patient') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login Activity Logs
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    role ENUM('Admin', 'Doctor', 'Patient') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    duration INT DEFAULT 15, -- 15 minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_appointments_doctor_start ON appointments(doctor_id, start_time);


-- ==========================================
-- Use Archive DB
-- ==========================================
USE hms_archive;

-- Users Table (Archive typically only contains activity, but storing users can be helpful for referencing, though not strictly required if we strictly archive transactional data. Let's create it for foreign key constraints, or omit foreign keys in archive for pure flat storage). 
-- For strict purity, we will mirror the exact structure but remove strict foreign key constraints in the archive so we can safely delete main records without cascading deleted activity.
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Doctor', 'Patient') NOT NULL,
    created_at TIMESTAMP
);

-- Login Activity Logs (Archive)
CREATE TABLE IF NOT EXISTS login_logs (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP,
    logout_time TIMESTAMP NULL,
    role ENUM('Admin', 'Doctor', 'Patient') NOT NULL
);
CREATE INDEX idx_archive_login_logs_user_date ON login_logs(user_id, login_time);

-- Appointments Table (Archive)
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    duration INT DEFAULT 15,
    created_at TIMESTAMP
);
CREATE INDEX idx_archive_appointments_doctor_start ON appointments(doctor_id, start_time);
