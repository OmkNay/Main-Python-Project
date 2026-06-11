# Expense Management & Reimbursement System

A full-stack mobile expense management app built for a German SMB.

## Architecture

```
ExpenseManagement/
├── backend/        FastAPI + SQLite backend
└── mobile/         React Native (Expo) mobile app
```

## Quick Start

### 1. Start the Backend

```bash
cd backend
./start.sh
```

The API runs at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

### 2. Start the Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS/Android), or press `i` for iOS simulator / `a` for Android emulator.

> **Physical device**: Edit `mobile/src/api/client.js` and change `API_BASE_URL` to your machine's local IP (e.g. `http://192.168.1.100:8000`).

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@test.de | password123 |
| Sales Manager | sales.manager@test.de | password123 |
| Project Manager | project.manager@test.de | password123 |
| Accounting Approver | accounting@test.de | password123 |
| Finance Manager | finance@test.de | password123 |
| Admin | admin@test.de | password123 |

## Features Implemented

### Expense Types
- Create requests (Sales/Project Managers only)
- Configurable approval workflow (Accounting → Finance)
- States: DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE → EXPIRED
- Budget tracking with spent/available display
- Full audit trail

### Reimbursements
- 2-step submission: select expense type → enter details + upload receipt
- Receipt upload (camera, gallery, document)
- States: DRAFT → SUBMITTED → FINANCE_APPROVAL → APPROVED → PAID
- Manager approve → Finance approve → Mark paid flow

### RBAC (Role-Based Access Control)
- Employees: submit claims only
- Managers: create budgets + approve claims
- Accounting: approve/reject expense types
- Finance: full approval + mark paid

### Notifications
- In-app notifications for all workflow transitions
- Unread count badge
- Mark individual / all as read

### Dashboard
- Role-aware statistics
- Quick action buttons

## PRD Test Cases Coverage

- TC-ET-001 through TC-ET-010: Expense type creation, approval, RBAC ✅
- TC-RB-001 through TC-RB-012: Reimbursement submission, approval, payment ✅
- TC-AW-001 through TC-AW-007: Workflow engine ✅
- TC-NF-001 through TC-NF-005: Notifications ✅
- TC-SC-001 through TC-SC-007: Security (JWT, RBAC, file validation) ✅
