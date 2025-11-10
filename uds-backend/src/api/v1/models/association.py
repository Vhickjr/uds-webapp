from sqlalchemy import (
    Column,
    DateTime,
    UUID,
    ForeignKey,
    Enum,
    CheckConstraint,
    Integer,
    text,
    Text,
    Index,
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


idx_user_requests_status_active = Index(
    "idx_user_requests_status_active", UserRequest.status
)

idx_user_borrowed_item = Index(
    "idx_user_borrowed_item",
    UserRequest.user_id,
    UserRequest.item_id,
    unique=True,
    postgresql_where=text('"status" = \'approved\' AND "returned_at" IS NULL'),
)


class ApprovedGuestRequest(BaseTableModel):
    __tablename__ = "approved_guest_requests"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="valid_quantity_a_g_r"),
        CheckConstraint(
            """
            (status = 'returned' AND returned_at IS NOT NULL)
            OR (status = 'rejected' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
            OR (status = 'approved' AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
            """,
            name="valid_workflow_a_g_r",
        ),
    )

    guest_id = Column(
        UUID(as_uuid=True), ForeignKey("guests.id", ondelete="CASCADE"), nullable=False
    )
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)

    request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pending_guest_requests.id", ondelete="CASCADE"),
        nullable=False,
    )

    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    status = Column(
        Enum(RequestStatusEnum, name="request_status_enum"),
        nullable=False,
        default=RequestStatusEnum.approved,
    )

    reviewed_at = Column(
        DateTime(timezone=True), server_default=text("now()"), nullable=True
    )
    returned_at = Column(DateTime(timezone=True), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    due_date = Column(
        DateTime(timezone=True), server_default=text("(now() + '7 day'::interval)")
    )

    # Relationships
    guest = relationship("Guest", back_populates="guest_requests")
    item = relationship("Item", back_populates="guest_requests")
    pending_request = relationship(
        "PendingGuestRequest", back_populates="approved_requests"
    )
    reviewer = relationship(
        "User",
        back_populates="reviewed_approved_guest_requests",
        foreign_keys=[reviewed_by],
    )


# Unique index added - idx_guest_borrowed_item prevents duplicate active borrowing
idx_guest_borrowed_item = Index(
    "idx_guest_borrowed_item",
    ApprovedGuestRequest.guest_id,
    ApprovedGuestRequest.item_id,
    unique=True,
    postgresql_where=text('"status" = \'approved\' AND "returned_at" IS NULL'),
)

# Admins will constantly query "show me all pending requests" or "show active rentals"
idx_approved_guest_requests_status_active = Index(
    "idx_approved_guest_requests_status_active", ApprovedGuestRequest.status
)


class PendingGuestRequest(BaseTableModel):
    __tablename__ = "pending_guest_requests"

    guest_id = Column(
        UUID(as_uuid=True), ForeignKey("guests.id", ondelete="CASCADE"), nullable=False
    )
    request = Column(Text, nullable=False)

    # Relationships
    guest = relationship(
        "Guest", back_populates="pending_requests", cascade="all, delete"
    )
    approved_requests = relationship(
        "ApprovedGuestRequest", back_populates="pending_request"
    )
