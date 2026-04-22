import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class MedicineService extends BaseService {
  constructor() {
    super('/medicine');
  }

  async register(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await this.create(payload);
  }

  async getAll(params = {}) {
    return await super.getAll(params);
  }

  async getByID(id) {
    return await apiClient.get(`${this.endpoint}/${id}`);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }

  async search(query) {
    return await super.search(query);
  }
}

export default new MedicineService();
