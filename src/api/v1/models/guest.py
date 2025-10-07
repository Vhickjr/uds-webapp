from sqlalchemy import Column, String, Text

from sqlalchemy.orm import relationship
from api.v1.models.base_model import BaseTableModel


class Guest(BaseTableModel):
    __tablename__ = "guests"

    firstname = Column(String(50), nullable=False)
    lastname = Column(String(50), nullable=False)
    email = Column(String(256), nullable=False)
    phone = Column(String(20), nullable=False)
    request = Column(Text, nullable=False)

    # Relationships
    guest_requests = relationship(
        "GuestRequest", back_populates="guest", cascade="all, delete"
    )
