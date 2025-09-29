from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    # username = db.Column(db.String(32), unique=True) -> very optional
    first_name = db.Column(db.String(32), unique=True)
    last_name = db.Column(db.String(32), unique=True)
    email = db.Column(db.String(64), unique=True)
    password = db.Column(db.String(32))