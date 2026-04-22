import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class AuditLogService extends BaseService {
  constructor() {
    super('/audit-logs');
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

  async export(params = {}) {
    const user = AuthService.getCurrentUser();
    const queryParams = {
      ...params,
      hospital_id: user?.hospital_id,
      format: params.format || 'csv'
    };
    return await apiClient.post(`${this.endpoint}/export`, null, {
      params: queryParams,
      responseType: 'blob'
    });
  }
}

export default new AuditLogService();

