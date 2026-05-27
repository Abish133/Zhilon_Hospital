import BaseService from './BaseService';
import apiClient from './apiClient';

class PharmacySaleService extends BaseService {
  constructor() {
    super('/pharmacy-sales');
  }

  async dispense(data) {
    const response = await apiClient.post('/pharmacy/sales/dispense', data);
    return response;
  }

  async returnIpd(data) {
    const response = await apiClient.post('/pharmacy/sales/return-ipd', data);
    return response;
  }
}

export default new PharmacySaleService();
