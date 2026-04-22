import BaseService from './BaseService';
import apiClient from '@config/api';

class RadiologyOrderService extends BaseService {
  constructor() {
    super('/radiology-orders');
  }

  getByPatient(patientId) {
    return apiClient.get(`${this.endpoint}`, { params: { patient_id: patientId } });
  }

  async getByPatientId(patientId) {
    return await apiClient.get(`${this.endpoint}/patient/${patientId}`);
  }

  getByStatus(status) {
    return apiClient.get(`${this.endpoint}`, { params: { status } });
  }

  scheduleOrder(orderId, scheduleData) {
    return this.update(orderId, { ...scheduleData, status: 'Scheduled' });
  }

  updateStatus(orderId, status) {
    return this.update(orderId, { status });
  }
}

export default new RadiologyOrderService();
