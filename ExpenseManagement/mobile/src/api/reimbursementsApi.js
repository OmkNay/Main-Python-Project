import client, { API_BASE_URL } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const listReimbursements = (params) =>
  client.get('/api/v1/reimbursements/', { params });

export const getReimbursement = (id) =>
  client.get(`/api/v1/reimbursements/${id}`);

export const createReimbursement = (data) =>
  client.post('/api/v1/reimbursements/', data);

export const uploadReceipt = async (reimbursementId, fileUri, fileName, mimeType) => {
  const token = await AsyncStorage.getItem('access_token');
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName || 'receipt.jpg',
    type: mimeType || 'image/jpeg',
  });

  const response = await fetch(
    `${API_BASE_URL}/api/v1/reimbursements/${reimbursementId}/upload-receipt`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }
  return response.json();
};

export const submitReimbursement = (id) =>
  client.post(`/api/v1/reimbursements/${id}/submit`);

export const approveReimbursement = (id, comments) =>
  client.post(`/api/v1/reimbursements/${id}/approve`, { comments });

export const rejectReimbursement = (id, comments) =>
  client.post(`/api/v1/reimbursements/${id}/reject`, { comments });

export const markPaid = (id, comments) =>
  client.post(`/api/v1/reimbursements/${id}/pay`, { comments });

export const getReimbursementAudit = (id) =>
  client.get(`/api/v1/reimbursements/${id}/audit`);
