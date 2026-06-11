from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from .database import engine, Base, get_db
from . import models
from .routers import auth_router, users, expense_types, reimbursements, workflows, notifications
from .schemas import DashboardStats
from .dependencies import get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expense Management & Reimbursement API",
    version="1.0.0",
    description="API for the Expense Management & Reimbursement Approval System",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/receipts", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(expense_types.router)
app.include_router(reimbursements.router)
app.include_router(workflows.router)
app.include_router(notifications.router)


@app.get("/api/v1/dashboard", response_model=DashboardStats, tags=["dashboard"])
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    et_q = db.query(models.ExpenseType)
    rb_q = db.query(models.Reimbursement)

    if current_user.role == "EMPLOYEE":
        rb_q = rb_q.filter(models.Reimbursement.employee_id == current_user.id)
    elif current_user.role in ("SALES_MANAGER", "PROJECT_MANAGER"):
        et_q = et_q.filter(models.ExpenseType.requested_by == current_user.id)

    paid_rb = rb_q.filter(models.Reimbursement.status == "PAID").all()

    return DashboardStats(
        total_expense_types=et_q.count(),
        active_expense_types=et_q.filter(models.ExpenseType.status == "ACTIVE").count(),
        pending_expense_types=et_q.filter(models.ExpenseType.status == "PENDING_APPROVAL").count(),
        total_reimbursements=rb_q.count(),
        pending_reimbursements=rb_q.filter(
            models.Reimbursement.status.in_(["SUBMITTED", "MANAGER_APPROVAL", "FINANCE_APPROVAL"])
        ).count(),
        approved_reimbursements=rb_q.filter(
            models.Reimbursement.status.in_(["APPROVED", "PAID"])
        ).count(),
        total_reimbursed_amount=sum(r.amount for r in paid_rb),
        unread_notifications=db.query(models.Notification).filter(
            models.Notification.user_id == current_user.id,
            models.Notification.read == False
        ).count()
    )


@app.get("/health")
def health():
    return {"status": "ok"}
