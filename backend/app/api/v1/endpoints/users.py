from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user import User, UserCreate, UserUpdate
from app.services.user import user_service, get_current_user

router = APIRouter()


@router.get("/me", response_model=User)
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get("/", response_model=List[User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve users.
    """
    users = user_service.get_multi(skip=skip, limit=limit)
    return users


@router.post("/", response_model=User)
def create_user(
    *,
    user_in: UserCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new user.
    """
    user = user_service.get_by_username(username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = user_service.create(obj_in=user_in)
    return user


@router.put("/me", response_model=User)
def update_user_me(
    *,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update own user.
    """
    user = user_service.update(db_obj=current_user, obj_in=user_in)
    return user


@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get a specific user by id.
    """
    user = user_service.get(id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user == current_user:
        return user
    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a user.
    """
    user = user_service.get(id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    user = user_service.update(db_obj=user, obj_in=user_in)
    return user
