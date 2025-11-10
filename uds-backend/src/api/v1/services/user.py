from typing import Optional, Annotated
import datetime as dt
from fastapi import status
from pydantic import EmailStr

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
import jwt
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext

from api.db.database import get_db
from api.utils.settings import settings
from api.core.base.services import Service
from api.v1.models.user import User
from api.v1.schemas import user

bearer_scheme = HTTPBearer(auto_error=False)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService(Service):
    """User service"""

    DUP_EXC = HTTPException(
        status_code=400,
        detail="User with this email or username already exists",
    )

    FORBIDDEN_EXC = HTTPException(
        status_code=403,
        detail="You do not have permission to access this resource",
    )

    NOT_FOUND_EXC = HTTPException(
        status_code=404,
        detail="User not found",
    )

    CREDENTIALS_EXC = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    def fetch_all(self, db: Session) -> list[User]:
        """Fetches all users from the database

        Args:
            db (Session): Db session object

        Returns:
            list[User]: A list of all User objects on the database
        """
        all_users = db.query(User).all()
        return all_users

    def fetch(self, db: Session, id: str, raise_404=False):
        """Fetches a User by their id"""

        user = db.get(User, id)

        if user is None and raise_404 is True:
            raise self.NOT_FOUND_EXC
        return user

    def fetch_by_email(
        self, db: Session, email: EmailStr, raise_404=False
    ) -> User | None:
        """Fetches a User by their email"""

        user = db.query(User).filter(User.email == email).first()

        if user is None and raise_404 is True:
            raise self.NOT_FOUND_EXC
        return user

    def create(
        self,
        db: Session,
        schema: user.CreateUserSchema,
    ) -> User:
        """Creates a new user


        Args:
            db (Session): Database session
            schema (user.CreateUserSchema): Pydantic Schema
            is_admin (bool, optional): Should user be an admin. Defaults to False.

        Raises:
            DUP_EXC: If user account already exists

        Returns:
            User: Return newly created User
        """

        # Hash password
        schema.password = self.hash_password(password=schema.password)

        try:
            schema_dump = schema.model_dump()

            user = User(**schema_dump)

            db.add(user)
            db.commit()
            db.refresh(user)

        except IntegrityError as e:
            raise self.DUP_EXC
        return user

    def update(
        self,
        db: Session,
        current_user: User,
        schema: user.UpdateUserSchema,
        id_target: str,
    ):
        """Update the User specified by id_target. Only an admin or
        the User should be allowed to make these changes

        Args:
            db (Session):
            current_user (User): Logged-in User as determined from access_token
            schema (User.UpdateUserSchema): Pydantic schema for updating model
            id_target (str): Target user  idto be updated

        Raises:
            dup_exception: Raised if update violated unique constraint

        Returns:
            User: updated User object
        """
        if id_target != current_user.id:
            raise self.FORBIDDEN_EXC

        user = self.fetch(db=db, id=id_target)

        if not user:
            raise self.NOT_FOUND_EXC

        update_data = schema.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(user, key, value)

        db.commit()
        db.refresh(user)
        return user

    def deactivateOrActivate(
        self,
        db: Session,
        id_target: str,
        current_user: User,
        is_active: bool = False,
    ) -> User:
        """Function to deactivate or reactivate a user.
        Only an admin or the target user has permission to make changes.

        Args:
            db (Session):
            id_target (str): Id of the target User
            currrent_user (User): User doing the deactivation

        Raises:
            self.FORBIDDEN_EXC: Raised if user is not admin or target user
            self.NOT_FOUND_EXC: Raised if user id_target is invalid

        Returns:
            User: _description_
        """

        if current_user.is_admin and id_target != current_user.id:
            raise self.FORBIDDEN_EXC

        target_user = self.fetch(db=db, id=id_target)

        if not target_user:
            raise self.NOT_FOUND_EXC

        target_user.is_active = is_active
        db.commit()
        db.refresh(target_user)

        return target_user

    def delete(self, db: Session, id_target: str, current_admin: User) -> bool:
        """Function to delete a user account. Only an admin has permission.

        Args:
            db (Session):
            id_target (str): Id of the target User
            currrent_admin (User): Admin doing the deletion

        Raises:
            self.FORBIDDEN_EXC: Raised if user is not admin or target user
            self.NOT_FOUND_EXC: Raised if user id_target is invalid

        Returns:
            User: _description_
        """

        if not current_admin.is_admin:
            raise self.FORBIDDEN_EXC

        user = self.fetch(db=db, id=id_target)

        if not user:
            raise self.NOT_FOUND_EXC

        db.delete(user)
        db.commit()

        return True

    def authenticate_user(self, db: Session, email: EmailStr, password: str):
        """Function to authenticate a user"""

        user: User = self.fetch_by_email(db, email=email)

        if not user:
            raise HTTPException(status_code=400, detail="Invalid user credentials")

        if not self.verify_password(password, user.password):
            raise HTTPException(status_code=400, detail="Invalid user credentials")

        if user.is_active is False:
            raise HTTPException(status_code=401, detail="Deactivated account")

        return user

    def hash_password(self, password: str) -> str:
        """Function to hash a password"""

        hashed_password = pwd_context.hash(secret=password)
        return hashed_password

    def verify_password(self, password: str, hash: str) -> bool:
        """Function to verify a hashed password"""

        return pwd_context.verify(secret=password, hash=hash)

    def create_access_token(self, user_id: str) -> str:
        """Function to create access token"""

        expires = dt.datetime.now(dt.timezone.utc) + dt.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        data = {"user_id": user_id, "exp": expires, "type": "access"}
        encoded_jwt = jwt.encode(data, settings.SECRET_KEY, settings.ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, user_id: str) -> str:
        """Function to create access token"""

        expires = dt.datetime.now(dt.timezone.utc) + dt.timedelta(
            days=settings.JWT_REFRESH_EXPIRY
        )
        data = {"user_id": user_id, "exp": expires, "type": "refresh"}
        encoded_jwt = jwt.encode(data, settings.SECRET_KEY, settings.ALGORITHM)
        return encoded_jwt

    def verify_access_token(
        self, access_token: str, credentials_exception: HTTPException
    ):
        """Funtcion to decode and verify access token"""

        try:
            payload = jwt.decode(
                access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("user_id")
            token_type = payload.get("type")

            if user_id is None:
                raise credentials_exception

            if token_type != "access":
                raise HTTPException(detail="Only access token allowed", status_code=401)

            return user_id

        except jwt.exceptions.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Access token expired")
        except jwt.exceptions.InvalidTokenError:
            raise credentials_exception

    def verify_refresh_token(
        self, refresh_token: str, credentials_exception: HTTPException
    ):
        """Funtcion to decode and verify refresh token"""

        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("user_id")
            token_type = payload.get("type")

            if user_id is None:
                raise credentials_exception

            if token_type != "refresh":
                raise HTTPException(
                    detail="Only refresh token allowed", status_code=401
                )

            return user_id

        except jwt.exceptions.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh token expired")
        except jwt.exceptions.InvalidTokenError:
            raise credentials_exception

    def refresh_access_token(self, current_refresh_token: str | None):
        """Function to generate new access token and rotate refresh token"""

        credentials_exception = HTTPException(
            status_code=401,
            detail="Could not validate refresh token",
        )

        if current_refresh_token is None:
            raise credentials_exception

        user_id = self.verify_refresh_token(
            current_refresh_token, credentials_exception
        )

        access = self.create_access_token(user_id=user_id)
        refresh = self.create_refresh_token(user_id=user_id)

        return access, refresh

    def get_user_from_refresh_token(self, refresh_token: str, db: Session):
        """Returns the the user embedded in the refresh token"""

        credentials_exception = HTTPException(
            status_code=401,
            detail="Could not validate refresh token",
        )

        user_id = self.verify_refresh_token(refresh_token, credentials_exception)
        user = self.fetch(db, user_id)
        if not user:
            raise credentials_exception
        return user

    def get_current_user(
        self,
        credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
        db: Session = Depends(get_db),
    ) -> User:
        """Function to get current logged in user"""

        credentials_exception = HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if credentials is None:
            raise credentials_exception

        user_id = self.verify_access_token(
            credentials.credentials, credentials_exception
        )
        user = self.fetch(db, user_id)
        if not user:
            raise credentials_exception
        return user

    def get_current_user_optional(
        self,
        credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
        db: Session = Depends(get_db),
    ) -> Optional[User]:
        """Used to optionally check for a user."""

        if credentials is None:
            return None

        credentials_exception = HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        user_id = self.verify_access_token(
            credentials.credentials, credentials_exception
        )
        user = self.fetch(db, user_id)
        if not user:
            raise credentials_exception
        return user

    def change_password(
        self,
        old_password: str,
        new_password: str,
        confirm_new_password: str,
        user: User,
        db: Session,
    ) -> bool:
        """Service function to change the user's password"""

        # If the user has a password, proceed with the normal password change process
        if not self.verify_password(old_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect old password.",
            )

        if new_password != confirm_new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password and confirmation do not match.",
            )

        user.password = self.hash_password(new_password)
        db.commit()

    def get_current_admin(
        self,
        credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
        db: Session = Depends(get_db),
    ):
        """Get the current super admin"""
        user = self.get_current_user(db=db, credentials=credentials)
        if user.is_admin is not True:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource",
            )
        return user

    def get_fullname(self, user):
        return f"{user.first_name} {user.last_name}"


user_service = UserService()
