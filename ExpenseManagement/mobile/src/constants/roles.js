export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  SALES_MANAGER: 'SALES_MANAGER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  ACCOUNTING_APPROVER: 'ACCOUNTING_APPROVER',
  FINANCE_MANAGER: 'FINANCE_MANAGER',
  ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
  EMPLOYEE: 'Employee',
  SALES_MANAGER: 'Sales Manager',
  PROJECT_MANAGER: 'Project Manager',
  ACCOUNTING_APPROVER: 'Accounting Approver',
  FINANCE_MANAGER: 'Finance Manager',
  ADMIN: 'Administrator',
};

export const canCreateExpenseType = (role) =>
  ['SALES_MANAGER', 'PROJECT_MANAGER', 'ADMIN'].includes(role);

export const canApproveExpenseType = (role) =>
  ['ACCOUNTING_APPROVER', 'FINANCE_MANAGER', 'ADMIN'].includes(role);

export const canApproveReimbursement = (role) =>
  ['SALES_MANAGER', 'PROJECT_MANAGER', 'FINANCE_MANAGER', 'ADMIN'].includes(role);

export const canMarkPaid = (role) =>
  ['FINANCE_MANAGER', 'ADMIN'].includes(role);

export const canManageWorkflows = (role) => role === 'ADMIN';

export const isManager = (role) =>
  ['SALES_MANAGER', 'PROJECT_MANAGER'].includes(role);
