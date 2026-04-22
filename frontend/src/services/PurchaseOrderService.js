import BaseService from './BaseService';
import apiClient from '@config/api';

class PurchaseOrderService extends BaseService {
  constructor() {
    super('/purchase-orders');
  }

  approve(id, data) {
    return apiClient.put(`${this.endpoint}/${id}/approve`, data);
  }

  triggerAutoReorder(data) {
    return apiClient.post(`${this.endpoint}/auto-reorder/trigger`, data);
  }

  checkStockLevels(hospitalId) {
    return apiClient.get(`${this.endpoint}/stock-levels/check`, {
      params: { hospital_id: hospitalId }
    });
  }
}

export default new PurchaseOrderService();
