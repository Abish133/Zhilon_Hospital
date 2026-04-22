import BaseService from './BaseService';
import apiClient from '@config/api';

class LabOrderService extends BaseService {
  constructor() {
    super('/lab-orders');
  }

  async getByPatientId(patientId) {
    return await apiClient.get(`${this.endpoint}/patient/${patientId}`);
  }
}

export default new LabOrderService();
