from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .auth import decode_token
from . import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

MANAGER_ROLES = {"SALES_MANAGER", "PROJECT_MANAGER"}
APPROVER_ROLES = {"ACCOUNTING_APPROVER", "FINANCE_MANAGER", "ADMIN"}


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(models.User).filter(models.User.id == payload.get("sub")).first()
    if not user or user.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def require_roles(*roles):
    def checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(roles)}"
            )
        return current_user
    return checker


def require_manager(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in MANAGER_ROLES and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers only")
    return current_user


def require_accounting(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in {"ACCOUNTING_APPROVER", "FINANCE_MANAGER", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accounting/Finance role required")
    return current_user


def require_finance(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in {"FINANCE_MANAGER", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Finance Manager role required")
    return current_user


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return current_user
