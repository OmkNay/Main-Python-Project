from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from ..database import get_db
from ..dependencies import get_current_user, require_manager
from ..schemas import ExpenseTypeCreate, ExpenseTypeResponse, ApprovalRequest, ApprovalActionResponse
from .. import models
from .notifications import create_notification

router = APIRouter(prefix="/api/v1/expense-types", tags=["expense-types"])

MANAGER_ROLES = {"SALES_MANAGER", "PROJECT_MANAGER", "ADMIN"}
ACCOUNTING_ROLES = {"ACCOUNTING_APPROVER", "FINANCE_MANAGER", "ADMIN"}


def _get_active_workflow(db: Session, workflow_type: str) -> Optional[models.ApprovalWorkflow]:
    return db.query(models.ApprovalWorkflow).filter(
        models.ApprovalWorkflow.workflow_type == workflow_type,
        models.ApprovalWorkflow.active == True
    ).first()


def _get_next_status(current_status: str, action: str) -> str:
    if action == "REJECT":
        return "REJECTED"
    if action == "REQUEST_CHANGES":
        return "CHANGES_REQUESTED"
    return "APPROVED"


def _log_action(
    db: Session, entity_type: str, entity_id: str,
    approver_id: str, action: str, old_status: str, new_status: str,
    comments: Optional[str] = None
):
    record = models.ApprovalAction(
        entity_type=entity_type,
        entity_id=entity_id,
        approver_id=approver_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        comments=comments
    )
    db.add(record)


def _sync_expense_type_status(expense_type: models.ExpenseType):
    if expense_type.status not in ("APPROVED", "ACTIVE", "EXPIRED"):
        return
    today = date.today()
    if expense_type.status == "APPROVED" and today >= expense_type.start_date:
        expense_type.status = "ACTIVE"
    elif expense_type.status in ("APPROVED", "ACTIVE") and today > expense_type.end_date:
        expense_type.status = "EXPIRED"


@router.get("/", response_model=List[ExpenseTypeResponse])
def list_expense_types(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    q = db.query(models.ExpenseType)
    if current_user.role in MANAGER_ROLES:
        if current_user.role != "ADMIN" and status != "ACTIVE":
            q = q.filter(models.ExpenseType.requested_by == current_user.id)
    if status:
        q = q.filter(models.ExpenseType.status == status.upper())

    results = q.order_by(models.ExpenseType.created_at.desc()).all()
    for et in results:
        _sync_expense_type_status(et)
    db.commit()
    return results


@router.post("/", response_model=ExpenseTypeResponse)
def create_expense_type(
    payload: ExpenseTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in MANAGER_ROLES:
        raise HTTPException(status_code=403, detail="Only managers can create expense types")

    expense_type = models.ExpenseType(
        name=payload.name,
        description=payload.description,
        department=payload.department,
        budget_amount=payload.budget_amount,
        currency=payload.currency,
        start_date=payload.start_date,
        end_date=payload.end_date,
        business_justification=payload.business_justification,
        requested_by=current_user.id,
        status="PENDING_APPROVAL"
    )
    db.add(expense_type)
    db.commit()
    db.refresh(expense_type)

    _log_action(db, "EXPENSE_TYPE", expense_type.id, current_user.id,
                "CREATE", "DRAFT", "PENDING_APPROVAL")

    accounting_users = db.query(models.User).filter(
        models.User.role.in_(["ACCOUNTING_APPROVER", "FINANCE_MANAGER"]),
        models.User.status == "ACTIVE"
    ).all()
    for u in accounting_users:
        create_notification(
            db, u.id,
            f"New Expense Type Request: {expense_type.name}",
            f"{current_user.first_name} {current_user.last_name} has requested a new expense type.",
            "EXPENSE_TYPE", expense_type.id
        )
    db.commit()
    db.refresh(expense_type)
    return expense_type


@router.get("/{expense_type_id}", response_model=ExpenseTypeResponse)
def get_expense_type(
    expense_type_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    et = db.query(models.ExpenseType).filter(models.ExpenseType.id == expense_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Expense type not found")
    _sync_expense_type_status(et)
    db.commit()
    return et


@router.post("/{expense_type_id}/approve", response_model=ExpenseTypeResponse)
def approve_expense_type(
    expense_type_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ACCOUNTING_ROLES:
        raise HTTPException(status_code=403, detail="Only accounting/finance can approve expense types")

    et = db.query(models.ExpenseType).filter(models.ExpenseType.id == expense_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Expense type not found")
    if et.status not in ("PENDING_APPROVAL", "CHANGES_REQUESTED"):
        raise HTTPException(status_code=400, detail=f"Cannot approve expense type with status {et.status}")

    existing = db.query(models.ApprovalAction).filter(
        models.ApprovalAction.entity_type == "EXPENSE_TYPE",
        models.ApprovalAction.entity_id == expense_type_id,
        models.ApprovalAction.approver_id == current_user.id,
        models.ApprovalAction.action == "APPROVE"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already approved this expense type")

    old_status = et.status
    et.status = "APPROVED"
    et.approved_by = current_user.id
    _sync_expense_type_status(et)

    _log_action(db, "EXPENSE_TYPE", et.id, current_user.id,
                "APPROVE", old_status, et.status, payload.comments)

    create_notification(
        db, et.requested_by,
        f"Expense Type Approved: {et.name}",
        f"Your expense type request '{et.name}' has been approved.",
        "EXPENSE_TYPE", et.id
    )
    db.commit()
    db.refresh(et)
    return et


@router.post("/{expense_type_id}/reject", response_model=ExpenseTypeResponse)
def reject_expense_type(
    expense_type_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ACCOUNTING_ROLES:
        raise HTTPException(status_code=403, detail="Only accounting/finance can reject expense types")

    et = db.query(models.ExpenseType).filter(models.ExpenseType.id == expense_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Expense type not found")
    if et.status not in ("PENDING_APPROVAL", "CHANGES_REQUESTED"):
        raise HTTPException(status_code=400, detail=f"Cannot reject expense type with status {et.status}")

    old_status = et.status
    et.status = "REJECTED"
    _log_action(db, "EXPENSE_TYPE", et.id, current_user.id,
                "REJECT", old_status, "REJECTED", payload.comments)

    create_notification(
        db, et.requested_by,
        f"Expense Type Rejected: {et.name}",
        f"Your expense type request '{et.name}' has been rejected. Reason: {payload.comments or 'No reason provided'}",
        "EXPENSE_TYPE", et.id
    )
    db.commit()
    db.refresh(et)
    return et


@router.post("/{expense_type_id}/request-changes", response_model=ExpenseTypeResponse)
def request_changes(
    expense_type_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ACCOUNTING_ROLES:
        raise HTTPException(status_code=403, detail="Only accounting/finance can request changes")

    et = db.query(models.ExpenseType).filter(models.ExpenseType.id == expense_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Expense type not found")
    if et.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Cannot request changes on status {et.status}")

    old_status = et.status
    et.status = "CHANGES_REQUESTED"
    _log_action(db, "EXPENSE_TYPE", et.id, current_user.id,
                "REQUEST_CHANGES", old_status, "CHANGES_REQUESTED", payload.comments)

    create_notification(
        db, et.requested_by,
        f"Changes Requested: {et.name}",
        f"Changes have been requested for '{et.name}'. Comments: {payload.comments or ''}",
        "EXPENSE_TYPE", et.id
    )
    db.commit()
    db.refresh(et)
    return et


@router.get("/{expense_type_id}/audit", response_model=List[ApprovalActionResponse])
def get_audit_log(
    expense_type_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    actions = db.query(models.ApprovalAction).filter(
        models.ApprovalAction.entity_type == "EXPENSE_TYPE",
        models.ApprovalAction.entity_id == expense_type_id
    ).order_by(models.ApprovalAction.timestamp.asc()).all()
    return actions
