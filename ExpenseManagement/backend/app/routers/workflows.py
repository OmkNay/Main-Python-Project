from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..dependencies import get_current_user, require_admin
from ..schemas import WorkflowCreate, WorkflowResponse
from .. import models

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


@router.get("/", response_model=List[WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in {"ADMIN", "FINANCE_MANAGER", "ACCOUNTING_APPROVER"}:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(models.ApprovalWorkflow).all()


@router.post("/", response_model=WorkflowResponse)
def create_workflow(
    payload: WorkflowCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    db.query(models.ApprovalWorkflow).filter(
        models.ApprovalWorkflow.workflow_type == payload.workflow_type,
        models.ApprovalWorkflow.active == True
    ).update({"active": False})

    workflow = models.ApprovalWorkflow(
        workflow_type=payload.workflow_type,
        name=payload.name,
        active=True
    )
    db.add(workflow)
    db.flush()

    for step in payload.steps:
        db.add(models.WorkflowStep(
            workflow_id=workflow.id,
            sequence=step.sequence,
            role=step.role
        ))

    db.commit()
    db.refresh(workflow)
    return workflow


@router.put("/{workflow_id}/deactivate", response_model=WorkflowResponse)
def deactivate_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    workflow = db.query(models.ApprovalWorkflow).filter(
        models.ApprovalWorkflow.id == workflow_id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow.active = False
    db.commit()
    db.refresh(workflow)
    return workflow
