import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class RosterService extends BaseService {
  constructor() {
    super('/roster');
  }

  async getAll(params = {}) {
    const user = AuthService.getCurrentUser();
    const queryParams = {
      ...params,
      hospital_id: user?.hospital_id
    };
    return await super.getAll(queryParams);
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.create(payload);
  }

  async bulkCreate(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.post(`${this.endpoint}/bulk`, payload);
  }

  async update(id, data) {
    return await super.update(id, data);
  }

  async delete(id) {
    return await super.delete(id);
  }

  async requestSwap(data) {
    return await apiClient.post(`${this.endpoint}/swap`, data);
  }

  async approveSwap(id, approve) {
    return await apiClient.put(`${this.endpoint}/${id}/swap`, { approve });
  }

  async markLeave(id, data) {
    return await apiClient.put(`${this.endpoint}/${id}/leave`, data);
  }

  async generateMonthly(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.post(`${this.endpoint}/generate`, payload);
  }
}

export default new RosterService();

