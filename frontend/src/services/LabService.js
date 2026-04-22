import BaseService from './BaseService';
import apiClient from '@config/api';

class LabService extends BaseService {
  constructor() {
    super('/lab');
  }

  // Test Master Management
  getAllTests(params) {
    return apiClient.get(`${this.endpoint}/tests`, { params });
  }

  createTest(data) {
    return apiClient.post(`${this.endpoint}/tests`, data);
  }

  updateTest(testId, data) {
    return apiClient.put(`${this.endpoint}/tests/${testId}`, data);
  }

  deleteTest(testId) {
    return apiClient.delete(`${this.endpoint}/tests/${testId}`);
  }

  // Lab Orders
  createOrder(data) {
    return apiClient.post(`${this.endpoint}/orders`, data);
  }

  getOrders(params) {
    return apiClient.get(`${this.endpoint}/orders`, { params });
  }

  // Sample Collection
  collectSample(orderId, data) {
    return apiClient.post(`${this.endpoint}/samples/${orderId}/collect`, data);
  }

  // Results Entry
  submitResults(orderId, data) {
    return apiClient.post(`${this.endpoint}/results/${orderId}`, data);
  }

  approveResults(orderId, data) {
    return apiClient.post(`${this.endpoint}/results/${orderId}/approve`, data);
  }

  // Test Parameters
  getTestParameters(testId) {
    return apiClient.get(`${this.endpoint}/tests/${testId}/parameters`);
  }
}

export default new LabService();
