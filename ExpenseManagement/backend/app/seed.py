"""
Run once to populate test data matching the PRD test data requirements.
Usage: cd backend && python -m app.seed
"""
from datetime import date, timedelta
from .database import SessionLocal, engine, Base
from . import models
from .auth import hash_password

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            print("Database already seeded.")
            return

        users_data = [
            {"first_name": "Anna", "last_name": "Bauer", "email": "employee@test.de",
             "password": "password123", "role": "EMPLOYEE", "department": "Operations"},
            {"first_name": "Klaus", "last_name": "Schmidt", "email": "sales.manager@test.de",
             "password": "password123", "role": "SALES_MANAGER", "department": "Sales"},
            {"first_name": "Maria", "last_name": "Weber", "email": "project.manager@test.de",
             "password": "password123", "role": "PROJECT_MANAGER", "department": "Projects"},
            {"first_name": "Hans", "last_name": "Fischer", "email": "accounting@test.de",
             "password": "password123", "role": "ACCOUNTING_APPROVER", "department": "Accounting"},
            {"first_name": "Eva", "last_name": "Müller", "email": "finance@test.de",
             "password": "password123", "role": "FINANCE_MANAGER", "department": "Finance"},
            {"first_name": "Admin", "last_name": "User", "email": "admin@test.de",
             "password": "password123", "role": "ADMIN", "department": "IT"},
        ]

        users = {}
        for u in users_data:
            user = models.User(
                first_name=u["first_name"],
                last_name=u["last_name"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                department=u["department"],
                status="ACTIVE"
            )
            db.add(user)
            users[u["role"]] = user

        db.flush()

        # Set manager relationships
        users["EMPLOYEE"].manager_id = users["SALES_MANAGER"].id

        today = date.today()
        expense_types_data = [
            {
                "name": "Customer Visit Expenses",
                "description": "Travel and meals for customer visits",
                "department": "Sales",
                "budget_amount": 10000.0,
                "currency": "EUR",
                "start_date": today - timedelta(days=30),
                "end_date": today + timedelta(days=335),
                "status": "ACTIVE",
                "business_justification": "Required for sales activities",
                "requested_by_role": "SALES_MANAGER",
                "approved_by_role": "FINANCE_MANAGER",
            },
            {
                "name": "Trade Fair Expenses",
                "description": "Expenses for trade fair participation",
                "department": "Marketing",
                "budget_amount": 5000.0,
                "currency": "EUR",
                "start_date": today + timedelta(days=10),
                "end_date": today + timedelta(days=100),
                "status": "PENDING_APPROVAL",
                "business_justification": "Annual trade fair participation",
                "requested_by_role": "SALES_MANAGER",
                "approved_by_role": None,
            },
            {
                "name": "Project Site Travel",
                "description": "Travel expenses for project site visits",
                "department": "Projects",
                "budget_amount": 8000.0,
                "currency": "EUR",
                "start_date": today - timedelta(days=60),
                "end_date": today - timedelta(days=10),
                "status": "REJECTED",
                "business_justification": "Site inspection requirements",
                "requested_by_role": "PROJECT_MANAGER",
                "approved_by_role": None,
            },
            {
                "name": "Expired Client Travel",
                "description": "Travel for client meetings",
                "department": "Sales",
                "budget_amount": 3000.0,
                "currency": "EUR",
                "start_date": today - timedelta(days=365),
                "end_date": today - timedelta(days=5),
                "status": "EXPIRED",
                "business_justification": "Client relationship maintenance",
                "requested_by_role": "SALES_MANAGER",
                "approved_by_role": "FINANCE_MANAGER",
            },
        ]

        expense_types = {}
        for et_data in expense_types_data:
            et = models.ExpenseType(
                name=et_data["name"],
                description=et_data["description"],
                department=et_data["department"],
                budget_amount=et_data["budget_amount"],
                currency=et_data["currency"],
                start_date=et_data["start_date"],
                end_date=et_data["end_date"],
                status=et_data["status"],
                business_justification=et_data["business_justification"],
                requested_by=users[et_data["requested_by_role"]].id,
                approved_by=users[et_data["approved_by_role"]].id if et_data["approved_by_role"] else None,
            )
            db.add(et)
            expense_types[et_data["name"]] = et

        db.flush()

        active_et = expense_types["Customer Visit Expenses"]
        reimbursements_data = [
            {
                "expense_type": active_et,
                "description": "Hotel stay Berlin - Customer visit",
                "amount": 250.0,
                "status": "PAID",
                "vendor_name": "Hilton Berlin",
            },
            {
                "expense_type": active_et,
                "description": "Taxi to client office",
                "amount": 45.0,
                "status": "SUBMITTED",
                "vendor_name": "Taxi Munich",
            },
            {
                "expense_type": active_et,
                "description": "Business dinner with client",
                "amount": 180.0,
                "status": "FINANCE_APPROVAL",
                "vendor_name": "Restaurant am See",
            },
        ]

        from datetime import datetime
        for rb_data in reimbursements_data:
            rb = models.Reimbursement(
                expense_type_id=rb_data["expense_type"].id,
                employee_id=users["EMPLOYEE"].id,
                expense_date=today - timedelta(days=5),
                amount=rb_data["amount"],
                currency="EUR",
                description=rb_data["description"],
                vendor_name=rb_data["vendor_name"],
                receipt_url="/uploads/receipts/sample.pdf",
                status=rb_data["status"],
                submitted_at=datetime.utcnow() if rb_data["status"] != "DRAFT" else None,
            )
            db.add(rb)

        active_et.spent_amount = 250.0

        # Default workflows
        et_workflow = models.ApprovalWorkflow(
            workflow_type="EXPENSE_TYPE",
            name="Default Expense Type Approval",
            active=True
        )
        rb_workflow = models.ApprovalWorkflow(
            workflow_type="REIMBURSEMENT",
            name="Default Reimbursement Approval",
            active=True
        )
        db.add(et_workflow)
        db.add(rb_workflow)
        db.flush()

        db.add(models.WorkflowStep(workflow_id=et_workflow.id, sequence=1, role="ACCOUNTING_APPROVER"))
        db.add(models.WorkflowStep(workflow_id=et_workflow.id, sequence=2, role="FINANCE_MANAGER"))
        db.add(models.WorkflowStep(workflow_id=rb_workflow.id, sequence=1, role="SALES_MANAGER"))
        db.add(models.WorkflowStep(workflow_id=rb_workflow.id, sequence=2, role="FINANCE_MANAGER"))

        db.commit()
        print("Database seeded successfully!")
        print("\nTest credentials:")
        for u in users_data:
            print(f"  {u['role']}: {u['email']} / {u['password']}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
