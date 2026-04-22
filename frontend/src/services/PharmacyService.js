import BaseService from './BaseService';
import apiClient from '@config/api';

class PharmacyService extends BaseService {
  constructor() {
    super('/pharmacy');
  }

  dispense(data) {
    return apiClient.post(`${this.endpoint}/dispense`, data);
  }

  getLowStock() {
    return apiClient.get(`${this.endpoint}/stock/low`);
  }

  getExpiringStock(months = 3) {
    return apiClient.get(`${this.endpoint}/stock/expiry`, { params: { months } });
  }
}

export default new PharmacyService();
