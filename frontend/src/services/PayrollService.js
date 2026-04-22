import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class PayrollService extends BaseService {
  constructor() {
    super('/payroll');
  }

  async getAll(params = {}) {
    const user = AuthService.getCurrentUser();
    const queryParams = {
      ...params,
      hospital_id: user?.hospital_id
    };
    return await super.getAll(queryParams);
  }

  async getById(id) {
    return await super.getById(id);
  }

  async generate(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.post(`${this.endpoint}/generate`, payload);
  }

  async approve(id, remarks) {
    return await apiClient.put(`${this.endpoint}/${id}/approve`, { remarks });
  }

  async process(id, data) {
    return await apiClient.put(`${this.endpoint}/${id}/process`, data);
  }

  async adjust(id, data) {
    return await apiClient.put(`${this.endpoint}/${id}/adjust`, data);
  }

  async getPayslip(id) {
    return await apiClient.get(`${this.endpoint}/${id}/payslip`, {
      responseType: 'blob'
    });
  }

  async cancel(id, remarks) {
    return await apiClient.put(`${this.endpoint}/${id}/cancel`, { remarks });
  }
}

export default new PayrollService();

