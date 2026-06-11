import client from './client';

export const listExpenseTypes = (status) =>
  client.get('/api/v1/expense-types/', { params: status ? { status } : {} });

export const getExpenseType = (id) =>
  client.get(`/api/v1/expense-types/${id}`);

export const createExpenseType = (data) =>
  client.post('/api/v1/expense-types/', data);

export const approveExpenseType = (id, comments) =>
  client.post(`/api/v1/expense-types/${id}/approve`, { comments });

export const rejectExpenseType = (id, comments) =>
  client.post(`/api/v1/expense-types/${id}/reject`, { comments });

export const requestChanges = (id, comments) =>
  client.post(`/api/v1/expense-types/${id}/request-changes`, { comments });

export const getExpenseTypeAudit = (id) =>
  client.get(`/api/v1/expense-types/${id}/audit`);
