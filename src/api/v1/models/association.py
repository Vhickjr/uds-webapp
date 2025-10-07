from sqlalchemy import (
    Column,
    DateTime,
    UUID,
    ForeignKey,
    Enum,
    CheckConstraint,
    Integer,
    text,
)

from sqlalchemy.orm import relationship
from api.v1.schemas.request import RequestStatusEnum
from api.v1.models.base_model import BaseTableModel


class UserRequest(BaseTableModel):
    __tablename__ = "user_requests"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="valid_quantity_u_r"),
        CheckConstraint(
            """
            (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
            OR (status = 'returned' AND returned_at IS NOT NULL)
            OR (status = 'rejected' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
            OR (status = 'approved' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
            """,
            name="valid_workflow_u_r",
        ),
    )

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    item_id = Column(
        UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=False
    )

    returned_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        Enum(RequestStatusEnum, name="request_status_enum"),
        nullable=False,
        default=RequestStatusEnum.pending,
    )
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    due_date = Column(
        DateTime(timezone=True),
        server_default=text("(now() + '7 day'::interval)"),
    )

    # Relationships
    user = relationship("User", back_populates="user_requests", foreign_keys=[user_id])
    item = relationship("Item", back_populates="user_requests")
    reviewer = relationship(
        "User", back_populates="reviewed_user_requests", foreign_keys=[reviewed_by]
    )


class GuestRequest(BaseTableModel):
    __tablename__ = "guest_requests"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="valid_quantity_g_r"),
        CheckConstraint(
            """
            (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
            OR (status = 'returned' AND returned_at IS NOT NULL)
            OR (status = 'rejected' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
            OR (status = 'approved' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
            """,
            name="valid_workflow_g_r",
        ),
    )

    guest_id = Column(
        UUID(as_uuid=True), ForeignKey("guests.id", ondelete="CASCADE"), nullable=False
    )
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)

    status = Column(
        Enum(RequestStatusEnum, name="request_status_enum"),
        nullable=False,
        default=RequestStatusEnum.approved,
    )
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    due_date = Column(
        DateTime(timezone=True), server_default=text("(now() + '7 day'::interval)")
    )

    # Relationships
    guest = relationship("Guest", back_populates="guest_requests")
    item = relationship("Item", back_populates="guest_requests")
    reviewer = relationship(
        "User", back_populates="reviewed_guest_requests", foreign_keys=[reviewed_by]
    )
