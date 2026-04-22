import BaseService from './BaseService';
import apiClient from '@config/api';

class BillingMainService extends BaseService {
  constructor() {
    super('/billing');
  }

  getOPBill(visitId) {
    return apiClient.get(`${this.endpoint}/op/${visitId}`);
  }

  getIPBill(admissionId) {
    return apiClient.get(`${this.endpoint}/ip/${admissionId}`);
  }

  makePayment(data) {
    return apiClient.post(`${this.endpoint}/payments`, data);
  }

  processRefund(data) {
    return apiClient.post(`${this.endpoint}/refunds`, data);
  }
}

export default new BillingMainService();
