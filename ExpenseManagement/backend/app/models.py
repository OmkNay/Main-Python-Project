import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Date, DateTime,
    ForeignKey, Boolean, Integer, Text
)
from sqlalchemy.orm import relationship
from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    department = Column(String(100))
    manager_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    role = Column(String(50), nullable=False)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manager = relationship("User", remote_side=[id], foreign_keys=[manager_id])
    expense_types_requested = relationship(
        "ExpenseType", foreign_keys="ExpenseType.requested_by", back_populates="requester"
    )
    reimbursements = relationship("Reimbursement", back_populates="employee")
    notifications = relationship("Notification", back_populates="user")


class ExpenseType(Base):
    __tablename__ = "expense_types"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String(100), nullable=False)
    budget_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, default=0.0)
    currency = Column(String(10), nullable=False, default="EUR")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(30), default="DRAFT")
    business_justification = Column(Text)
    requested_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requested_by], back_populates="expense_types_requested")
    final_approver = relationship("User", foreign_keys=[approved_by])
    reimbursements = relationship("Reimbursement", back_populates="expense_type")


class Reimbursement(Base):
    __tablename__ = "reimbursements"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    expense_type_id = Column(String(36), ForeignKey("expense_types.id"), nullable=False)
    employee_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    expense_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="EUR")
    description = Column(Text, nullable=False)
    receipt_url = Column(String(500), nullable=True)
    vendor_name = Column(String(200), nullable=True)
    tax_amount = Column(Float, nullable=True)
    cost_center = Column(String(100), nullable=True)
    status = Column(String(30), default="DRAFT")
    submitted_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)

    expense_type = relationship("ExpenseType", back_populates="reimbursements")
    employee = relationship("User", back_populates="reimbursements")


class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workflow_type = Column(String(30), nullable=False)
    name = Column(String(200), nullable=False)
    active = Column(Boolean, default=True)

    steps = relationship("WorkflowStep", back_populates="workflow", order_by="WorkflowStep.sequence")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    workflow_id = Column(String(36), ForeignKey("approval_workflows.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    role = Column(String(50), nullable=False)

    workflow = relationship("ApprovalWorkflow", back_populates="steps")


class ApprovalAction(Base):
    __tablename__ = "approval_actions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    entity_type = Column(String(30), nullable=False)
    entity_id = Column(String(36), nullable=False)
    approver_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action = Column(String(30), nullable=False)
    comments = Column(Text, nullable=True)
    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    approver = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    entity_type = Column(String(30), nullable=True)
    entity_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
