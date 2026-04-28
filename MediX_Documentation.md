# MediX - Hospital Management System: Project Overview

Welcome to the **MediX** platform documentation! This file was created to give anyone—whether you are a beginner programmer, a project stakeholder, or a medical professional—a crystal-clear understanding of how this software works beneath the surface. 

MediX is a "Full-Stack" web application. This means it consists of three distinct layers communicating together: 
1. **The Frontend** (What the user sees).
2. **The Backend** (The brain computing the logic).
3. **The Database** (The memory storing the information).

---

## 🛠️ The Technology Stack
A "Tech Stack" is the list of tools and programming languages we used to build the software.

### **Frontend Tools (The Face of the App)**
*   **React (via Vite)**: The core JavaScript library. It allows us to build interactive user interfaces using reusable pieces called "Components" (like buttons and forms) without needing to reload the web page. Vite is the incredibly fast engine used to run React.
*   **Vanilla CSS**: Used for styling. Instead of relying on heavy CSS frameworks, we custom-built a **"Glassmorphism" UI**. This gives the app a premium, frosted-glass aesthetic with modern gradients and glowing animations.
*   **Lucide React**: A lightweight library for the sleek, professional icons you see across the application.
*   **React Router DOM**: Acts as the traffic cop. It navigates the user between pages (like from `/auth` to `/dashboard`) safely.

### **Backend Tools (The Engine)**
*   **Node.js & Express.js**: Our server foundation. Node allows JavaScript to run on the computer's server, and Express creates the API (Application Programming Interface)—the bridge that securely transmits data between the database and the frontend.
*   **Sequelize (ORM)**: An "Object-Relational Mapper". Instead of writing raw, highly complex SQL database codes manually, Sequelize allows us to manage database tables using native JavaScript objects.
*   **JWT (JSON Web Tokens)**: Secure digital passports. When a user logs in, they get a JWT token. They show this token to access protected dashboard data without having to log in constantly.
*   **Node-Cron**: A background task scheduler. We use it to run automated daily maintenance tasks while you sleep.

### **Database Tools (The Memory)**
*   **MySQL**: A powerful, strictly structured database system that organizes data into clean, heavily related grids (like an advanced Excel spreadsheet).

---

## 🖥️ Part 1: The Frontend Experience
The frontend lives in the `/MediX` folder. It is designed to be highly responsive, real-time, and customized based on who is logging in.

### **Dynamic Role-Based Dashboards**
The system uses a smart `Dashboard.jsx`. Depending on the user's role, the UI completely changes:
1.  **Patient View**: Patients can scroll through available doctors, select a disease, and pick strict 15-minute time slots to book an appointment.
2.  **Doctor View**: Doctors see a clean, live timeline of their upcoming patients. 
3.  **Admin (Super-User) View**: Admins possess a "God-View". They can see every appointment globally and have the power to Edit or Delete records.

### **Live Feature Implementations**
*   **Real-Time Dashboard Sync**: The frontend passively "polls" (asks) the database every 15 seconds. If a patient books an appointment, the Doctor's dashboard dynamically updates instantly to reflect the new patient without requiring a page refresh!
*   **Slot-Conflict Prevention**: Before a patient even hits the "Book" button, the system natively generates exactly what 15-minute slots are open using a dropdown, graying out active overlaps to mathematically stop double-bookings natively.

---

## ⚙️ Part 2: The Backend Logic
The backend lives in the `/node_backend` folder. It processes raw data securely.

### **API Endpoints (The Communication Bridge)**
*   When the frontend needs information, it knocks on a specific door (Endpoint) on the backend.
*   Example: A `GET` request to `/api/appointments` triggers the `dataController`. The controller securely looks at the JWT token, figures out who is asking, and returns the customized schedule.

### **Name Mapping (JOIN Operations)**
When an appointment is saved to the data table, it only saves numbers: `doctor_id = 3`, `patient_id = 5`. Our backend `dataController.js` runs a SQL `LEFT JOIN`—smartly translating those random numbers back into human-readable names before sending them to the UI, ensuring the dashboard reads cleanly (like "Dr. Zion" instead of "Doctor #3").

---

## 🗄️ Part 3: The Dual-Database Architecture
This is the most advanced and highly professional aspect of the MediX system. Instead of jamming everything into one database table (which makes computers slow down over time as data builds up over years), we use a **Two-Database Ledger Method**.

### 1. `hms_main` (The Active Database)
*   Used **only** for the present and the future. 
*   If someone books an appointment for today or next week, it lives here. This database is meant to be small, incredibly localized, and lightning-fast.

### 2. `hms_archive` (The Cold Storage Vault)
*   Used for historical logs and past data.
*   If an appointment date passes and crosses into "yesterday", it doesn't belong in the active timeline anymore.

### **How the Magic Works (The Migration)**
1.  **The Nightly Cron Job**: At midnight, `node-cron` fires a script (`dailyArchive.js`). It actively scans `hms_main`. If it finds any appointments that occurred in the past, it surgically rips them out of the `hms_main` database and saves them forever in `hms_archive`.
2.  **Boundary-Aware Admin Updates**: If an Administrator decides to edit an appointment and move a past appointment into the future (or vice-versa), our `appointmentCtrl.js` calculates the mathematical boundary. It will seamlessly teleport the record back and forth between the two databases automatically behind the scenes to maintain absolute system integrity.

---

## 📝 Summary Checklist
1. The **React** frontend provides a glowing, live-syncing UI.
2. The **Express API** provides strict logical blocking to stop things like double-booking race conditions.
3. The **MySQL Dual-Database** splits workloads seamlessly so the application runs at maximum performance for years without slowing down.
