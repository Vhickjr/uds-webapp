from enum import Enum, auto


class UsersRoleEnum(int, Enum):
    guest = auto()
    intern = auto()
    staff = auto()
    admin = auto()
