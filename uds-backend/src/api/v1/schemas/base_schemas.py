from pydantic import BaseModel
from pydantic_extra_types.phone_numbers import PhoneNumber, PhoneNumberValidator
from typing import Annotated, Union


class BaseSuccessResponseSchema(BaseModel):
    success: bool
    message: str


CustomNumberType = Annotated[
    Union[str, PhoneNumber], PhoneNumberValidator(number_format="E164")
]
