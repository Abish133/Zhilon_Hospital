import BaseService from './BaseService';
import apiClient from '@config/api';

class InventoryMainService extends BaseService {
  constructor() {
    super('/inventory');
  }

  createPO(data) {
    return apiClient.post(`${this.endpoint}/purchase-orders`, data);
  }

  recordGRN(data) {
    return apiClient.post(`${this.endpoint}/grn`, data);
  }

  getPurchaseOrders(params) {
    return apiClient.get(`${this.endpoint}/purchase-orders`, { params });
  }

  approvePO(poId) {
    return apiClient.put(`${this.endpoint}/purchase-orders/${poId}/approve`);
  }

  issueToDepart(data) {
    return apiClient.post(`${this.endpoint}/issue`, data);
  }

  returnFromDepart(data) {
    return apiClient.post(`${this.endpoint}/return`, data);
  }
}

export default new InventoryMainService();
