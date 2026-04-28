🏥 Hospital Management System (HMS)

A Flask-based Hospital Management System that manages patients, doctors, appointments, and user authentication with role-based access control.
This project is developed for academic / internship purposes and demonstrates full-stack backend development using Flask + MySQL.

📌 Features

🔐 User Authentication (Signup / Login / Logout)

👤 Role-based access:

Doctor

Patient

🩺 Doctor Management

📅 Patient Appointment Booking

✏️ Edit & ❌ Delete Appointments

🔍 Search Doctor by Name or Department

📊 Appointment View:

Doctors → View all appointments

Patients → View only their bookings

🔒 Secure password hashing

🧪 Database connection testing route

🛠️ Tech Stack
Layer	Technology
Backend	Flask (Python)
Database	MySQL
ORM	SQLAlchemy
Authentication	Flask-Login
Security	Werkzeug Password Hashing
Frontend	HTML, CSS, Jinja2
Server	Flask Development Server
📂 Project Structure
hms-project/
│
├── app.py
├── templates/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── doctor.html
│   ├── patient.html
│   ├── booking.html
│   ├── edit.html
│   └── trigers.html
│
├── static/
│   └── (css, images if any)
│
└── README.md

⚙️ Database Configuration

The project uses MySQL with the following configuration:

mysql+pymysql://root:Root123@localhost/hms

Parameter	Value
Username	root
Password	Root123
Database	hms
Host	localhost

⚠️ Update credentials in app.py if your MySQL password is different.

🚀 How to Run the Project
1️⃣ Start MySQL Server

Using XAMPP → Start MySQL
OR

Using Services (Windows) → Start MySQL/MySQL80

2️⃣ Create Database

Open MySQL or phpMyAdmin and run:

CREATE DATABASE hms;

3️⃣ Install Required Packages
pip install flask flask-sqlalchemy flask-login pymysql werkzeug

4️⃣ Run the Application
python app.py


On first run:

All tables are created automatically

Sample users, doctors, and patients are inserted

5️⃣ Test Database Connection

Open browser:

http://127.0.0.1:5000/test


Expected Output:

Database is connected successfully!

👥 Default Login Credentials
Doctor (Admin)
Email: admin@hms.com
Password: admin123

Patient
Email: john@gmail.com
Password: john123

🔐 Security Features

Passwords stored using hashing

Protected routes using @login_required

Role-based data visibility

Secure session management

🎓 Academic Relevance

This project is suitable for:

Mini Project

Internship Submission

Flask + Database Learning

Backend Development Practice

Viva & Demonstration

📌 Future Enhancements

Admin dashboard

Payment module

Email notifications

Prescription management

Deployment (Render / PythonAnywhere)

🧑‍💻 Author

Sahil Jangam
Computer Engineering Student
Flask | MySQL | Backend Development

📄 License

This project is for educational purposes only.
