import BaseService from './BaseService';
import apiClient from '@config/api';

class BillService extends BaseService {
  constructor() {
    super('/bills');
  }

  getByPatient(patientId) {
    return this.getAll({ patient_id: patientId });
  }

  getByPaymentStatus(paymentStatus) {
    return this.getAll({ payment_status: paymentStatus });
  }

  getByBillType(billType) {
    return this.getAll({ bill_type: billType });
  }

  getBillSummary(params = {}) {
    return apiClient.get(`${this.endpoint}/summary`, { params });
  }

  // Generate bill from episode
  generateBill(billData) {
    return apiClient.post(`${this.endpoint}/generate`, billData);
  }

  // Get bill details with all charges
  getBillDetails(billId) {
    return apiClient.get(`${this.endpoint}/${billId}/details`);
  }
}

export default new BillService();

