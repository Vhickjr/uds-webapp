from .. import db
from flask_login import UserMixin
from enum import Enum
from datetime import datetime


class UserRole(Enum):
    GUEST = "guest"
    INTERN = "intern"
    STAFF = "staff"
    ADMIN = "admin"


class UserCatalog(db.Model):
    __tablename__ = "user_catalog"

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)
    catalog_id = db.Column(db.String, db.ForeignKey("catalog.id"), primary_key=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="user_catalogs")
    catalog = db.relationship("Catalog", back_populates="catalog_users")

    def __repr__(self):
        return f"<UserCatalog user={self.user_id} catalog={self.catalog_id} role={self.role}>"


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    first_name = db.Column(db.String(32))
    last_name = db.Column(db.String(32))
    password = db.Column(db.String(65), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)

    user_catalogs = db.relationship("UserCatalog", back_populates="user")

    @property
    def catalogs(self):
        return [uc.catalog for uc in self.user_catalogs]

    def __repr__(self):
        return f"<User {self.username}>"
