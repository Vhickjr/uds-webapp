from sqlalchemy import Column, String, Enum, Integer, Text, CheckConstraint

from sqlalchemy.orm import relationship
from api.v1.models.base_model import BaseTableModel
from api.v1.schemas.user import UsersRoleEnum


class Item(BaseTableModel):
    __tablename__ = "items"

    __table_args__ = (
        CheckConstraint("total = available + damaged + in_use", name="valid_quantities"),
    )

    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    assigned_role = Column(
        Enum(UsersRoleEnum, name="users_role_enum"),
        nullable=False,
        default=UsersRoleEnum.admin,
    )
    total = Column(Integer, nullable=False, default=0)
    available = Column(Integer, nullable=False, default=0)
    damaged = Column(Integer, nullable=False, default=0)
    in_use = Column(Integer, nullable=False, default=0)

    user_requests = relationship("UserRequest", back_populates="item")
    guest_requests = relationship("GuestRequest", back_populates="item")
