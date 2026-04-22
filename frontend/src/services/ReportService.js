import BaseService from './BaseService';
import apiClient from '@config/api';

class ReportService extends BaseService {
  constructor() {
    super('/reports');
  }

  getOPDFootfall(params) {
    return apiClient.get(`${this.endpoint}/opd-statistics`, { params });
  }

  getIPDOccupancy(params) {
    return apiClient.get(`${this.endpoint}/ipd-occupancy`, { params });
  }

  getRevenue(params) {
    return apiClient.get(`${this.endpoint}/revenue`, { params });
  }

  getDoctorPerformance(params) {
    return apiClient.get(`${this.endpoint}/doctor-performance`, { params });
  }

  getStockExpiry(params) {
    return apiClient.get(`${this.endpoint}/inventory/expiry`, { params });
  }

  getOutstandingPayments(params) {
    return apiClient.get(`${this.endpoint}/outstanding-payments`, { params });
  }

  getInventoryConsumption(params) {
    return apiClient.get(`${this.endpoint}/inventory/consumption`, { params });
  }

  exportReport(reportType, params) {
    return apiClient.get(`${this.endpoint}/export/${reportType}`, {
      params,
      responseType: 'blob'
    });
  }
}

export default new ReportService();
