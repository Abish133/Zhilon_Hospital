import BaseService from './BaseService';
import apiClient from '@config/api';

class IpdAdmissionService extends BaseService {
  constructor() {
    super('/ipd-admissions');
  }

  getByPatient(uhid) {
    return apiClient.get(`${this.endpoint}?uhid=${uhid}`);
  }

  transferBed(data) {
    return this.post(`${this.baseUrl}/transfer-bed`, data);
  }
}

export default new IpdAdmissionService();
