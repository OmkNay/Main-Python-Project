import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from ..database import get_db
from ..dependencies import get_current_user
from ..schemas import ReimbursementCreate, ReimbursementResponse, ApprovalRequest, ApprovalActionResponse
from .. import models
from .notifications import create_notification

router = APIRouter(prefix="/api/v1/reimbursements", tags=["reimbursements"])

UPLOAD_DIR = "uploads/receipts"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".gif"}
MAX_FILE_SIZE_MB = 10

MANAGER_ROLES = {"SALES_MANAGER", "PROJECT_MANAGER", "ADMIN"}
FINANCE_ROLES = {"FINANCE_MANAGER", "ADMIN"}


def _log_action(
    db: Session, entity_id: str, approver_id: str,
    action: str, old_status: str, new_status: str,
    comments: Optional[str] = None
):
    record = models.ApprovalAction(
        entity_type="REIMBURSEMENT",
        entity_id=entity_id,
        approver_id=approver_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        comments=comments
    )
    db.add(record)


def _get_active_et(db: Session, expense_type_id: str) -> models.ExpenseType:
    et = db.query(models.ExpenseType).filter(
        models.ExpenseType.id == expense_type_id
    ).first()
    if not et:
        raise HTTPException(status_code=404, detail="Expense type not found")
    today = date.today()
    if et.status not in ("ACTIVE", "APPROVED"):
        raise HTTPException(
            status_code=400,
            detail=f"Expense type is not active (status: {et.status})"
        )
    if today > et.end_date:
        raise HTTPException(status_code=400, detail="Expense type has expired")
    return et


@router.get("/", response_model=List[ReimbursementResponse])
def list_reimbursements(
    status: Optional[str] = Query(None),
    expense_type_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    q = db.query(models.Reimbursement)

    if current_user.role in FINANCE_ROLES:
        pass  # See all
    elif current_user.role in MANAGER_ROLES:
        pass  # See all for approval purposes
    else:
        q = q.filter(models.Reimbursement.employee_id == current_user.id)

    if status:
        q = q.filter(models.Reimbursement.status == status.upper())
    if expense_type_id:
        q = q.filter(models.Reimbursement.expense_type_id == expense_type_id)

    return q.order_by(models.Reimbursement.submitted_at.desc()).all()


@router.post("/", response_model=ReimbursementResponse)
def create_reimbursement(
    payload: ReimbursementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    et = _get_active_et(db, payload.expense_type_id)

    today = date.today()
    if payload.expense_date < et.start_date or payload.expense_date > et.end_date:
        raise HTTPException(
            status_code=400,
            detail=f"Expense date must be between {et.start_date} and {et.end_date}"
        )

    reimbursement = models.Reimbursement(
        expense_type_id=payload.expense_type_id,
        employee_id=current_user.id,
        expense_date=payload.expense_date,
        amount=payload.amount,
        currency=payload.currency,
        description=payload.description,
        vendor_name=payload.vendor_name,
        tax_amount=payload.tax_amount,
        cost_center=payload.cost_center,
        status="DRAFT"
    )
    db.add(reimbursement)
    db.commit()
    db.refresh(reimbursement)
    return reimbursement


@router.post("/{reimbursement_id}/upload-receipt", response_model=ReimbursementResponse)
async def upload_receipt(
    reimbursement_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reimbursement = db.query(models.Reimbursement).filter(
        models.Reimbursement.id == reimbursement_id,
        models.Reimbursement.employee_id == current_user.id
    ).first()
    if not reimbursement:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reimbursement.status not in ("DRAFT",):
        raise HTTPException(status_code=400, detail="Can only upload receipts on draft reimbursements")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Use: {ALLOWED_EXTENSIONS}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{reimbursement_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    reimbursement.receipt_url = f"/uploads/receipts/{filename}"
    db.commit()
    db.refresh(reimbursement)
    return reimbursement


@router.post("/{reimbursement_id}/submit", response_model=ReimbursementResponse)
def submit_reimbursement(
    reimbursement_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reimbursement = db.query(models.Reimbursement).filter(
        models.Reimbursement.id == reimbursement_id,
        models.Reimbursement.employee_id == current_user.id
    ).first()
    if not reimbursement:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reimbursement.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Only draft reimbursements can be submitted")
    if not reimbursement.receipt_url:
        raise HTTPException(status_code=400, detail="Receipt is required before submission")

    et = reimbursement.expense_type
    available_budget = et.budget_amount - et.spent_amount
    if reimbursement.amount > available_budget:
        raise HTTPException(
            status_code=400,
            detail=f"Amount exceeds available budget. Available: {available_budget} {et.currency}"
        )

    old_status = reimbursement.status
    reimbursement.status = "SUBMITTED"
    reimbursement.submitted_at = datetime.utcnow()

    _log_action(db, reimbursement.id, current_user.id,
                "SUBMIT", old_status, "SUBMITTED")

    managers = db.query(models.User).filter(
        models.User.role.in_(["SALES_MANAGER", "PROJECT_MANAGER", "FINANCE_MANAGER"]),
        models.User.status == "ACTIVE"
    ).all()
    for m in managers:
        create_notification(
            db, m.id,
            f"New Reimbursement: {reimbursement.description[:50]}",
            f"{current_user.first_name} {current_user.last_name} submitted a reimbursement of {reimbursement.amount} {reimbursement.currency}.",
            "REIMBURSEMENT", reimbursement.id
        )
    db.commit()
    db.refresh(reimbursement)
    return reimbursement


@router.post("/{reimbursement_id}/approve", response_model=ReimbursementResponse)
def approve_reimbursement(
    reimbursement_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    allowed_roles = MANAGER_ROLES | FINANCE_ROLES
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions to approve")

    reimbursement = db.query(models.Reimbursement).filter(
        models.Reimbursement.id == reimbursement_id
    ).first()
    if not reimbursement:
        raise HTTPException(status_code=404, detail="Reimbursement not found")

    existing = db.query(models.ApprovalAction).filter(
        models.ApprovalAction.entity_type == "REIMBURSEMENT",
        models.ApprovalAction.entity_id == reimbursement_id,
        models.ApprovalAction.approver_id == current_user.id,
        models.ApprovalAction.action == "APPROVE"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already approved this reimbursement")

    old_status = reimbursement.status
    if current_user.role in MANAGER_ROLES:
        if reimbursement.status != "SUBMITTED":
            raise HTTPException(status_code=400, detail=f"Cannot approve from status {reimbursement.status}")
        reimbursement.status = "FINANCE_APPROVAL"
        new_status = "FINANCE_APPROVAL"

        finance_users = db.query(models.User).filter(
            models.User.role == "FINANCE_MANAGER",
            models.User.status == "ACTIVE"
        ).all()
        for u in finance_users:
            create_notification(
                db, u.id,
                f"Reimbursement Pending Finance Approval",
                f"A reimbursement of {reimbursement.amount} {reimbursement.currency} is awaiting your approval.",
                "REIMBURSEMENT", reimbursement.id
            )
    else:
        if reimbursement.status not in ("SUBMITTED", "FINANCE_APPROVAL"):
            raise HTTPException(status_code=400, detail=f"Cannot approve from status {reimbursement.status}")
        reimbursement.status = "APPROVED"
        reimbursement.approved_at = datetime.utcnow()
        new_status = "APPROVED"

        et = reimbursement.expense_type
        et.spent_amount = (et.spent_amount or 0) + reimbursement.amount

        create_notification(
            db, reimbursement.employee_id,
            "Reimbursement Approved",
            f"Your reimbursement of {reimbursement.amount} {reimbursement.currency} has been approved.",
            "REIMBURSEMENT", reimbursement.id
        )

    _log_action(db, reimbursement.id, current_user.id,
                "APPROVE", old_status, new_status, payload.comments)
    db.commit()
    db.refresh(reimbursement)
    return reimbursement


@router.post("/{reimbursement_id}/reject", response_model=ReimbursementResponse)
def reject_reimbursement(
    reimbursement_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    allowed_roles = MANAGER_ROLES | FINANCE_ROLES
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions to reject")

    reimbursement = db.query(models.Reimbursement).filter(
        models.Reimbursement.id == reimbursement_id
    ).first()
    if not reimbursement:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reimbursement.status not in ("SUBMITTED", "FINANCE_APPROVAL"):
        raise HTTPException(status_code=400, detail=f"Cannot reject from status {reimbursement.status}")

    old_status = reimbursement.status
    reimbursement.status = "REJECTED"
    _log_action(db, reimbursement.id, current_user.id,
                "REJECT", old_status, "REJECTED", payload.comments)

    create_notification(
        db, reimbursement.employee_id,
        "Reimbursement Rejected",
        f"Your reimbursement of {reimbursement.amount} {reimbursement.currency} was rejected. Reason: {payload.comments or 'No reason provided'}",
        "REIMBURSEMENT", reimbursement.id
    )
    db.commit()
    db.refresh(reimbursement)
    return reimbursement


@router.post("/{reimbursement_id}/pay", response_model=ReimbursementResponse)
def mark_paid(
    reimbursement_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in FINANCE_ROLES:
        raise HTTPException(status_code=403, detail="Only Finance Manager can mark as paid")

    reimbursement = db.query(models.Reimbursement).filter(
        models.Reimbursement.id == reimbursement_id
    ).first()
    if not reimbursement:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reimbursement.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Only approved reimbursements can be marked paid")

    old_status = reimbursement.status
    reimbursement.status = "PAID"
    reimbursement.paid_at = datetime.utcnow()
    _log_action(db, reimbursement.id, current_user.id,
                "PAID", old_status, "PAID", payload.comments)

    create_notification(
        db, reimbursement.employee_id,
        "Reimbursement Paid",
        f"Your reimbursement of {reimbursement.amount} {reimbursement.currency} has been paid.",
        "REIMBURSEMENT", reimbursement.id
    )
    db.commit()
    db.refresh(reimbursement)
    return reimbursement


@router.get("/{reimbursement_id}", response_model=ReimbursementResponse)
def get_reimbursement(
    reimbursement_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reimbursement = db.query(models.Reimbursement).filter(
        models.Reimbursement.id == reimbursement_id
    ).first()
    if not reimbursement:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if current_user.role == "EMPLOYEE" and reimbursement.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return reimbursement


@router.get("/{reimbursement_id}/audit", response_model=List[ApprovalActionResponse])
def get_audit_log(
    reimbursement_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.ApprovalAction).filter(
        models.ApprovalAction.entity_type == "REIMBURSEMENT",
        models.ApprovalAction.entity_id == reimbursement_id
    ).order_by(models.ApprovalAction.timestamp.asc()).all()
