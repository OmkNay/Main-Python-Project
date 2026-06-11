from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..dependencies import get_current_user, require_admin
from ..auth import hash_password
from ..schemas import UserResponse, UserCreate
from .. import models

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.User).filter(models.User.status == "ACTIVE").all()


@router.post("/", response_model=UserResponse)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        department=payload.department,
        role=payload.role,
        manager_id=payload.manager_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/managers", response_model=List[UserResponse])
def list_managers(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    manager_roles = ["SALES_MANAGER", "PROJECT_MANAGER", "FINANCE_MANAGER", "ACCOUNTING_APPROVER"]
    return db.query(models.User).filter(
        models.User.role.in_(manager_roles),
        models.User.status == "ACTIVE"
    ).all()
