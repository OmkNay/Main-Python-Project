from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class UserRole(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    SALES_MANAGER = "SALES_MANAGER"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    ACCOUNTING_APPROVER = "ACCOUNTING_APPROVER"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    ADMIN = "ADMIN"


class ExpenseTypeStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REJECTED = "REJECTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"


class ReimbursementStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    MANAGER_APPROVAL = "MANAGER_APPROVAL"
    FINANCE_APPROVAL = "FINANCE_APPROVAL"
    APPROVED = "APPROVED"
    PAID = "PAID"
    REJECTED = "REJECTED"


class WorkflowType(str, Enum):
    EXPENSE_TYPE = "EXPENSE_TYPE"
    REIMBURSEMENT = "REIMBURSEMENT"


# ── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ── Users ───────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    department: Optional[str]
    role: str
    status: str
    manager_id: Optional[str]

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    department: Optional[str] = None
    role: UserRole
    manager_id: Optional[str] = None


# ── Expense Types ────────────────────────────────────────────────────────────

class ExpenseTypeCreate(BaseModel):
    name: str
    description: str
    department: str
    budget_amount: float
    currency: str = "EUR"
    start_date: date
    end_date: date
    business_justification: str

    @field_validator("budget_amount")
    @classmethod
    def budget_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("budget_amount must be greater than 0")
        return v

    @field_validator("end_date")
    @classmethod
    def end_date_after_start(cls, v, info):
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("end_date must be >= start_date")
        return v


class ExpenseTypeResponse(BaseModel):
    id: str
    name: str
    description: str
    department: str
    budget_amount: float
    spent_amount: float
    currency: str
    start_date: date
    end_date: date
    status: str
    business_justification: Optional[str]
    requested_by: str
    approved_by: Optional[str]
    created_at: datetime
    requester: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ── Reimbursements ────────────────────────────────────────────────────────────

class ReimbursementCreate(BaseModel):
    expense_type_id: str
    expense_date: date
    amount: float
    currency: str = "EUR"
    description: str
    vendor_name: Optional[str] = None
    tax_amount: Optional[float] = None
    cost_center: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("amount must be greater than 0")
        return v


class ReimbursementResponse(BaseModel):
    id: str
    expense_type_id: str
    employee_id: str
    expense_date: date
    amount: float
    currency: str
    description: str
    receipt_url: Optional[str]
    vendor_name: Optional[str]
    tax_amount: Optional[float]
    cost_center: Optional[str]
    status: str
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    paid_at: Optional[datetime]
    employee: Optional[UserResponse] = None
    expense_type: Optional[ExpenseTypeResponse] = None

    class Config:
        from_attributes = True


# ── Approval ─────────────────────────────────────────────────────────────────

class ApprovalRequest(BaseModel):
    comments: Optional[str] = None


class ApprovalActionResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    approver_id: str
    action: str
    comments: Optional[str]
    old_status: Optional[str]
    new_status: Optional[str]
    timestamp: datetime
    approver: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ── Workflows ─────────────────────────────────────────────────────────────────

class WorkflowStepSchema(BaseModel):
    sequence: int
    role: str


class WorkflowCreate(BaseModel):
    workflow_type: WorkflowType
    name: str
    steps: List[WorkflowStepSchema]


class WorkflowStepResponse(BaseModel):
    id: str
    sequence: int
    role: str

    class Config:
        from_attributes = True


class WorkflowResponse(BaseModel):
    id: str
    workflow_type: str
    name: str
    active: bool
    steps: List[WorkflowStepResponse] = []

    class Config:
        from_attributes = True


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    read: bool
    entity_type: Optional[str]
    entity_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_expense_types: int
    active_expense_types: int
    pending_expense_types: int
    total_reimbursements: int
    pending_reimbursements: int
    approved_reimbursements: int
    total_reimbursed_amount: float
    unread_notifications: int


TokenResponse.model_rebuild()
