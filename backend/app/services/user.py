from typing import Any, Dict, Optional, Union
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError
from app.core import security
from app.core.security import get_password_hash, verify_password
from app.models.user import User as UserModel
from app.schemas.user import UserCreate, UserUpdate
from app.db.deps import get_db


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get(self, id: Any) -> Optional[UserModel]:
        return self.db.query(UserModel).filter(UserModel.id == id).first()

    def get_by_username(self, *, username: str) -> Optional[UserModel]:
        return self.db.query(UserModel).filter(UserModel.username == username).first()

    def create(self, *, obj_in: UserCreate) -> UserModel:
        db_obj = UserModel(
            username=obj_in.username,
            hashed_password=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            is_superuser=obj_in.is_superuser,
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(
        self,
        *,
        db_obj: UserModel,
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> UserModel:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def authenticate(self, *, username: str, password: str) -> Optional[UserModel]:
        user = self.get_by_username(username=username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: UserModel) -> bool:
        return user.is_active

    def is_superuser(self, user: UserModel) -> bool:
        return user.is_superuser

    def get_multi(self, *, skip: int = 0, limit: int = 100) -> list[UserModel]:
        return self.db.query(UserModel).offset(skip).limit(limit).all()


# Dependency
def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


def get_current_user(
    token: str = Depends(security.oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserModel:
    """
    Get current user from JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = security.decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_service(db).get_by_username(username=username)
    if user is None:
        raise credentials_exception
    return user


user_service = UserService
