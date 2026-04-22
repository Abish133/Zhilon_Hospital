import BaseService from './BaseService';
import apiClient from '@config/api';

class RadiologyService extends BaseService {
  constructor() {
    super('/radiology');
  }

  createOrder(data) {
    return apiClient.post(`${this.endpoint}/orders`, data);
  }

  submitReport(orderId, data) {
    return apiClient.post(`${this.endpoint}/reports/${orderId}`, data);
  }

  scheduleModality(orderId, data) {
    return apiClient.post(`${this.endpoint}/schedule/${orderId}`, data);
  }

  performImaging(orderId, data) {
    return apiClient.post(`${this.endpoint}/imaging/${orderId}`, data);
  }

  approveReport(orderId, data) {
    return apiClient.post(`${this.endpoint}/approve/${orderId}`, data);
  }
}

export default new RadiologyService();
