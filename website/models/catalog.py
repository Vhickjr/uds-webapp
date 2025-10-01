from .. import db
from uuid import uuid4
from .user import UserRole


class Catalog(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    name = db.Column(db.String(256), nullable=False)
    total = db.Column(db.Integer)
    available = db.Column(db.Integer)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.Text, nullable=False)
    min_role = db.Column(db.Enum(UserRole), nullable=False)

    catalog_users = db.relationship('UserCatalog', back_populates='catalog')
    
    @property
    def users(self):
        return [cu.user for cu in self.catalog_users]
    
    def __repr__(self):
        return f'<Catalog {self.name}>'