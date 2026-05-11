import { apiClient } from './apiClient';

export const billingService = {
  // Bills
  async getBills(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bills?${searchParams}`);
    return response;
  },

  async getBillById(billId) {
    const response = await apiClient.get(`/bills/${billId}`);
    return response;
  },

  async getBillWithCharges(billId) {
    const response = await apiClient.get(`/bills/${billId}/charges`);
    return response;
  },

  async generateBill(billData) {
    const response = await apiClient.post('/bills/generate', billData);
    return response;
  },

  async getPendingBills(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bills/pending?${searchParams}`);
    return response;
  },

  async getBillingSummary(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bills/summary?${searchParams}`);
    return response;
  },

  async updateBill(billId, billData) {
    const response = await apiClient.put(`/bills/${billId}`, billData);
    return response;
  },

  // Bill Charges
  async getBillCharges(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bill-charges?${searchParams}`);
    return response;
  },

  async getChargesByEpisode(episodeId) {
    const response = await apiClient.get(`/bill-charges/episode/${episodeId}`);
    return response;
  },

  async addCharge(chargeData) {
    const response = await apiClient.post('/bill-charges', chargeData);
    return response;
  },

  async addChargeFromMaster(chargeData) {
    const response = await apiClient.post('/bill-charges/from-master', chargeData);
    return response;
  },

  async updateCharge(chargeId, chargeData) {
    const response = await apiClient.put(`/bill-charges/${chargeId}`, chargeData);
    return response;
  },

  async deleteCharge(chargeId) {
    const response = await apiClient.delete(`/bill-charges/${chargeId}`);
    return response;
  },

  // Payments
  async getPayments(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/payments?${searchParams}`);
    return response;
  },

  async processBillPayment(paymentData) {
    const response = await apiClient.post('/payments/process-bill', paymentData);
    return response;
  },

  async createPayment(paymentData) {
    const response = await apiClient.post('/payments', paymentData);
    return response;
  },

  async getPaymentSummary(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/payments/summary?${searchParams}`);
    return response;
  },

  // Advance Payments
  async getAdvancePayments(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/payment-advances?${searchParams}`);
    return response;
  },

  async createAdvancePayment(advanceData) {
    const response = await apiClient.post('/payment-advances', advanceData);
    return response;
  },

  async updateAdvancePayment(advanceId, advanceData) {
    const response = await apiClient.put(`/payment-advances/${advanceId}`, advanceData);
    return response;
  },

  // Refunds
  async getRefunds(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/refunds?${searchParams}`);
    return response;
  },

  async processRefund(refundData) {
    const response = await apiClient.post('/refunds', refundData);
    return response;
  },

  async updateRefund(refundId, refundData) {
    const response = await apiClient.put(`/refunds/${refundId}`, refundData);
    return response;
  },

  // Billing Episodes
  async getBillingEpisodes(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/billing-episodes?${searchParams}`);
    return response;
  },

  async getBillingEpisodeById(episodeId) {
    const response = await apiClient.get(`/billing-episodes/${episodeId}`);
    return response;
  },

  async createBillingEpisode(episodeData) {
    const response = await apiClient.post('/billing-episodes', episodeData);
    return response;
  },

  async updateBillingEpisode(episodeId, episodeData) {
    const response = await apiClient.put(`/billing-episodes/${episodeId}`, episodeData);
    return response;
  },

  // Charge Masters
  async getChargeMasters(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/charge-masters?${searchParams}`);
    return response;
  },

  async getChargeMasterById(chargeId) {
    const response = await apiClient.get(`/charge-masters/${chargeId}`);
    return response;
  },

  async createChargeMaster(chargeData) {
    const response = await apiClient.post('/charge-masters', chargeData);
    return response;
  },

  async updateChargeMaster(chargeId, chargeData) {
    const response = await apiClient.put(`/charge-masters/${chargeId}`, chargeData);
    return response;
  },

  async deleteChargeMaster(chargeId) {
    const response = await apiClient.delete(`/charge-masters/${chargeId}`);
    return response;
  },

  // Utility functions
  async searchPatients(searchTerm) {
    const response = await apiClient.get(`/patients?search=${encodeURIComponent(searchTerm)}`);
    return response;
  },

  async getActiveAdmissions(patientId) {
    const response = await apiClient.get(`/ipd-admissions?patient_id=${patientId}&status=Active`);
    return response;
  },

  // Reports
  async getBillingReport(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/reports/billing?${searchParams}`);
    return response;
  },

  async getPaymentReport(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/reports/payments?${searchParams}`);
    return response;
  },

  async getRefundReport(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/reports/refunds?${searchParams}`);
    return response;
  }
};

export default billingService;