from enum import Enum, auto


class RequestStatusEnum(int, Enum):
    pending = auto()
    approved = auto()
    rejected = auto()
    returned = auto()
