import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class VendorService extends BaseService {
  constructor() {
    super('/vendors');
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
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }

  getVendorItems(vendorId) {
    return apiClient.get(`${this.endpoint}/${vendorId}/items`);
  }

  addVendorItem(vendorId, itemData) {
    return apiClient.post(`${this.endpoint}/${vendorId}/items`, itemData);
  }
}

export default new VendorService();
