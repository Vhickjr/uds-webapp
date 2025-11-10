from sqlalchemy import Column, String, Enum, Boolean

from sqlalchemy.orm import relationship
from api.v1.models.base_model import BaseTableModel
from api.v1.schemas.user import UsersRoleEnum


class User(BaseTableModel):
    __tablename__ = "users"

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(256), unique=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    password = Column(String(72), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    role = Column(
        Enum(UsersRoleEnum, name="users_role_enum"),
        nullable=False,
        default=UsersRoleEnum.intern,
    )

    user_requests = relationship(
        "UserRequest",
        back_populates="user",
        foreign_keys="[UserRequest.user_id]",
        cascade="all, delete",
    )

    reviewed_user_requests = relationship(
        "UserRequest",
        back_populates="reviewer",
        foreign_keys="[UserRequest.reviewed_by]",
    )
    reviewed_approved_guest_requests = relationship(
        "ApprovedGuestRequest",
        back_populates="reviewer",
        foreign_keys="[ApprovedGuestRequest.reviewed_by]",
    )

    def to_dict(self) -> dict:
        """returns a dictionary representation of the submission"""
        obj_dict = self.__dict__.copy()
        obj_dict.pop("_sa_instance_state", None)
        obj_dict["id"] = self.id

        obj_dict["requests"] = [x.id for x in self.user_requests]

        return obj_dict

    @property
    def is_admin(self):
        return self.role == "admin"
