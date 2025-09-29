from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from .models import User
from . import db

auth = Blueprint('auth', __name__)


@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.form
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()
        if user:
            if check_password_hash(user.password, password):
                # flash('Logged in successfully!', category='success')
                login_user(user, remember=True)
                return redirect(url_for('views.home'))
            else:
                flash('incorrect login details', category='error')
        else:
            flash('incorrect login details', category='error')

    return render_template("login.html", text="Testing", user=current_user)



@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))


@auth.route('/sign-up', methods=['GET', 'POST'])
def sign_up(): # rework this function such that only admin can create new user

    if request.method == 'POST':
        data = request.form
        email = data.get('email')
        user_name = data.get('userName')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        password = data.get('password')

        if len(email) < 4:
            flash('invalid email')
        elif len(user_name) < 2:
            flash('invalid name', category="error")
        elif len(password) < 4:
            flash("password is too short", category="error")
        else:
            #add userdata to database
            user = User.query.filter_by(email=email).first()
            if user:
                flash('Email already exists', category='error')
            else:
                new_user = User(email=email, username=user_name, first_name=first_name, last_name=last_name, password=generate_password_hash(password, method='pbkdf2:sha256', salt_length=16))
                db.session.add(new_user)
                db.session.commit()

                login_user(new_user, remember=True)
                flash("Account created!", category="true")
                return redirect(url_for('views.home'))

    elif request.method == 'GET':
        data = request.form

    return render_template("signup.html", user=current_user)