import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class InventoryCateService extends BaseService {
  constructor() {
    super('/inventory-categories');
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.create(payload);
  }

  async getAll(params = {}) {
    return await super.getAll(params);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }

  async searchCategories(query) {
    return await this.search(query);
  }
}

export default new InventoryCateService();