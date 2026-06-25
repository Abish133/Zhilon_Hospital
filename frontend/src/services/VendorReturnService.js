import BaseService from './BaseService';
import apiClient from '@config/api';

class VendorReturnService extends BaseService {
  constructor() {
    super('/vendor-returns');
  }

  approve(id, data) {
    return apiClient.put(`${this.endpoint}/${id}/approve`, data);
  }

  complete(id, data) {
    return apiClient.put(`${this.endpoint}/${id}/complete`, data || {});
  }

  reject(id, data) {
    return apiClient.put(`${this.endpoint}/${id}/reject`, data);
  }
}

export default new VendorReturnService();
