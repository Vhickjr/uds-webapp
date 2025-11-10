from enum import Enum, auto

from pydantic import (
    BaseModel,
    Field,
    EmailStr,
    StringConstraints,
    ConfigDict,
    WrapValidator,
)
from typing import Annotated
from datetime import datetime
from api.v1.schemas.base_schemas import BaseSuccessResponseSchema, CustomNumberType


class UsersRoleEnum(int, Enum):
    guest = auto()
    intern = auto()
    staff = auto()
    admin = auto()


def user_role_by_name(v: str, handler, info) -> UsersRoleEnum:
    try:
        return UsersRoleEnum[v].name
    except KeyError:
        raise ValueError(f"Input should be {', '.join(UsersRoleEnum._member_names_)}")


UsersRoleEnumByName = Annotated[UsersRoleEnum, WrapValidator(user_role_by_name)]


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogoutResponse(BaseSuccessResponseSchema):
    pass


class UserBaseSchema(BaseModel):
    email: EmailStr
    first_name: str = Annotated[
        str, StringConstraints(min_length=2, max_length=50, strip_whitespace=True)
    ]
    last_name: str = Annotated[
        str, StringConstraints(min_length=2, max_length=50, strip_whitespace=True)
    ]
    phone: CustomNumberType
    role: UsersRoleEnumByName = UsersRoleEnum["intern"].name


class CreateUserSchema(UserBaseSchema):
    password: Annotated[
        str, StringConstraints(min_length=3, max_length=64, strip_whitespace=True)
    ]


class CreateUserResponseSchema(UserBaseSchema):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DataUserResponseSchema(BaseModel):
    data: CreateUserResponseSchema


class CreateUserResponseModelSchema(BaseSuccessResponseSchema, DataUserResponseSchema):
    access_token: str
    refresh_token: str


class GetUserResponseModelSchema(BaseSuccessResponseSchema, DataUserResponseSchema):
    pass


class RefreshAccessTokenResponse(BaseSuccessResponseSchema):
    access_token: str
    refresh_token: str


class ChangePasswordSchema(BaseModel):
    """Schema for changing password of a mod"""

    old_password: str
    new_password: str
    confirm_new_password: str


class UpdateUserSchema(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None


class UpdateUserByAdminSchema(UpdateUserSchema):
    role: UsersRoleEnumByName


class RetrieveUsersModelResponseSchema(BaseSuccessResponseSchema):
    data: list[CreateUserResponseSchema]


class RetrieveSingleUserModelResponseSchema(BaseSuccessResponseSchema):
    data: CreateUserResponseSchema
