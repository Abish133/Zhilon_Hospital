import BaseService from './BaseService';
import apiClient from '@config/api';

class PaymentService extends BaseService {
  constructor() {
    super('/payments');
  }

  getByBill(billId) {
    return this.getAll({ bill_id: billId });
  }

  getByPaymentType(paymentType) {
    return this.getAll({ payment_type: paymentType });
  }

  getByPaymentMode(paymentMode) {
    return this.getAll({ payment_mode: paymentMode });
  }

  // Process payment for a bill
  processPayment(paymentData) {
    return apiClient.post(`${this.endpoint}`, paymentData);
  }

  // Get payment history for a bill
  getPaymentHistory(billId) {
    return apiClient.get(`${this.endpoint}/bill/${billId}`);
  }
}

export default new PaymentService();