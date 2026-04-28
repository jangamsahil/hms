from flask import Flask, render_template, request, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, logout_user, login_manager, LoginManager, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import json

# Flask app setup
local_server = True
app = Flask(__name__)
app.secret_key = 'hmsprojects'

# Login manager setup
login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Root123@localhost/hms'



db = SQLAlchemy(app)

# -------------------- MODELS --------------------

class Test(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    usertype = db.Column(db.String(50))
    email = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(1000))

class Patients(db.Model):
    pid = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(50))
    name = db.Column(db.String(50))
    gender = db.Column(db.String(50))
    slot = db.Column(db.String(50))
    disease = db.Column(db.String(50))
    time = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    dept = db.Column(db.String(50))
    number = db.Column(db.String(50))

class Doctors(db.Model):
    did = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(50))
    doctorname = db.Column(db.String(50))
    dept = db.Column(db.String(50))

class Trigr(db.Model):
    tid = db.Column(db.Integer, primary_key=True)
    pid = db.Column(db.Integer)
    email = db.Column(db.String(50))
    name = db.Column(db.String(50))
    action = db.Column(db.String(50))
    timestamp = db.Column(db.String(50))

    # -------------------- DATABASE INITIALIZATION --------------------
with app.app_context():
    db.create_all()
    print("✅ All database tables created successfully!")

    # ---------- INSERT SAMPLE DATA IF EMPTY ----------
    if not User.query.first():
        admin = User(username="Admin", usertype="Doctor", email="admin@hms.com",
                     password=generate_password_hash("admin123"))
        user1 = User(username="John", usertype="Patient", email="john@gmail.com",
                     password=generate_password_hash("john123"))
        db.session.add_all([admin, user1])
        db.session.commit()
        print("👩‍⚕️ Default users added")

    if not Doctors.query.first():
        d1 = Doctors(email="dr.sharma@hms.com", doctorname="Dr. Sharma", dept="Cardiology")
        d2 = Doctors(email="dr.verma@hms.com", doctorname="Dr. Verma", dept="Neurology")
        d3 = Doctors(email="dr.kiran@hms.com", doctorname="Dr. Kiran", dept="Orthopedics")
        db.session.add_all([d1, d2, d3])
        db.session.commit()
        print("🩺 Sample doctors added")

    if not Patients.query.first():
        p1 = Patients(email="john@gmail.com", name="John Doe", gender="Male", slot="Morning",
                      disease="Flu", time="10:00 AM", date="2025-10-12", dept="General", number="9876543210")
        db.session.add(p1)
        db.session.commit()
        print("👨‍⚕️ Sample patient added")


# -------------------- ROUTES --------------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/doctors', methods=['POST', 'GET'])
def doctors():
    if request.method == "POST":
        email = request.form.get('email')
        doctorname = request.form.get('doctorname')
        dept = request.form.get('dept')

        query = Doctors(email=email, doctorname=doctorname, dept=dept)
        db.session.add(query)
        db.session.commit()
        flash("Doctor information stored successfully", "primary")

    return render_template('doctor.html')

@app.route('/patients', methods=['POST', 'GET'])
@login_required
def patient():
    doct = Doctors.query.all()

    if request.method == "POST":
        email = request.form.get('email')
        name = request.form.get('name')
        gender = request.form.get('gender')
        slot = request.form.get('slot')
        disease = request.form.get('disease')
        time = request.form.get('time')
        date = request.form.get('date')
        dept = request.form.get('dept')
        number = request.form.get('number')

        if len(number) != 10:
            flash("Please enter a 10-digit number", "warning")
            return render_template('patient.html', doct=doct)

        query = Patients(email=email, name=name, gender=gender, slot=slot,
                         disease=disease, time=time, date=date, dept=dept, number=number)
        db.session.add(query)
        db.session.commit()

        flash("Booking Confirmed", "info")

    return render_template('patient.html', doct=doct)

@app.route('/bookings')
@login_required
def bookings():
    em = current_user.email
    if current_user.usertype == "Doctor":
        query = Patients.query.all()
    else:
        query = Patients.query.filter_by(email=em).all()
    return render_template('booking.html', query=query)

@app.route("/edit/<string:pid>", methods=['POST', 'GET'])
@login_required
def edit(pid):
    post = Patients.query.filter_by(pid=pid).first()

    if request.method == "POST":
        post.email = request.form.get('email')
        post.name = request.form.get('name')
        post.gender = request.form.get('gender')
        post.slot = request.form.get('slot')
        post.disease = request.form.get('disease')
        post.time = request.form.get('time')
        post.date = request.form.get('date')
        post.dept = request.form.get('dept')
        post.number = request.form.get('number')

        db.session.commit()
        flash("Slot Updated Successfully", "success")
        return redirect('/bookings')

    return render_template('edit.html', posts=post)

@app.route("/delete/<string:pid>", methods=['POST', 'GET'])
@login_required
def delete(pid):
    query = Patients.query.filter_by(pid=pid).first()
    db.session.delete(query)
    db.session.commit()
    flash("Slot Deleted Successfully", "danger")
    return redirect('/bookings')

@app.route('/signup', methods=['POST', 'GET'])
def signup():
    if request.method == "POST":
        username = request.form.get('username')
        usertype = request.form.get('usertype')
        email = request.form.get('email')
        password = request.form.get('password')

        user = User.query.filter_by(email=email).first()
        if user:
            flash("Email already exists", "warning")
            return render_template('signup.html')

        hash_password = generate_password_hash(password)
        myquery = User(username=username, usertype=usertype, email=email, password=hash_password)
        db.session.add(myquery)
        db.session.commit()
        flash("Signup successful! Please login", "success")
        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == "POST":
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            flash("Login Successful", "primary")
            return redirect(url_for('index'))
        else:
            flash("Invalid Credentials", "danger")
            return render_template('login.html')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash("Logout Successful", "warning")
    return redirect(url_for('login'))

@app.route('/details')
@login_required
def details():
    posts = Trigr.query.all()
    return render_template('trigers.html', posts=posts)

@app.route('/search', methods=['POST', 'GET'])
@login_required
def search():
    if request.method == "POST":
        query = request.form.get('search')
        name = Doctors.query.filter_by(doctorname=query).first()
        dept = Doctors.query.filter_by(dept=query).first()

        if name or dept:
            flash("Doctor is Available", "info")
        else:
            flash("Doctor is Not Available", "danger")

    return render_template('index.html')

@app.route('/test')
def test():
    try:
        Test.query.all()
        return 'Database is connected successfully!'
    except:
        return 'Database connection failed.'

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
