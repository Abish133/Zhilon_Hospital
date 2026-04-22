import BaseService from './BaseService';
import apiClient from '@config/api';

class RadiologyReportService extends BaseService {
  constructor() {
    super('/radiology-reports');
  }

  getByOrderId(orderId) {
    return apiClient.get(`${this.endpoint}`, { params: { rad_order_id: orderId } });
  }

  submitReport(reportData) {
    return this.create(reportData);
  }
}

export default new RadiologyReportService();
