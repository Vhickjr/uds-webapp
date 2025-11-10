from sqlalchemy import Column, String, Text

from sqlalchemy.orm import relationship
from api.v1.models.base_model import BaseTableModel


class Guest(BaseTableModel):
    __tablename__ = "guests"

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(256), nullable=False)
    phone = Column(String(20), nullable=False)
    request = Column(Text, nullable=False)

    # Relationships
    pending_requests = relationship(
        "PendingGuestRequest", back_populates="guest", cascade="all, delete"
    )
    approved_requests = relationship(
        "ApprovedGuestRequest", back_populates="guest", cascade="all, delete"
    )
