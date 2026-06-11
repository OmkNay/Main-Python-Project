import client from './client';

export const listNotifications = () =>
  client.get('/api/v1/notifications');

export const markRead = (id) =>
  client.put(`/api/v1/notifications/${id}/read`);

export const markAllRead = () =>
  client.put('/api/v1/notifications/mark-all-read');

export const getUnreadCount = () =>
  client.get('/api/v1/notifications/unread-count');

export const getDashboard = () =>
  client.get('/api/v1/dashboard');
