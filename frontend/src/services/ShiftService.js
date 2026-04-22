import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class ShiftService extends BaseService {
  constructor() {
    super('/shifts');
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

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.create(payload);
  }

  async update(id, data) {
    return await super.update(id, data);
  }

  async delete(id) {
    return await super.delete(id);
  }
}

export default new ShiftService();

