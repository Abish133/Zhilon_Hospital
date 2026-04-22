import { apiClient } from './apiClient';

export const billingService = {
  // Bills
  async getBills(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bills?${searchParams}`);
    return response.data;
  },

  async getBillById(billId) {
    const response = await apiClient.get(`/bills/${billId}`);
    return response.data;
  },

  async getBillWithCharges(billId) {
    const response = await apiClient.get(`/bills/${billId}/charges`);
    return response.data;
  },

  async generateBill(billData) {
    const response = await apiClient.post('/bills/generate', billData);
    return response.data;
  },

  async getPendingBills(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bills/pending?${searchParams}`);
    return response.data;
  },

  async getBillingSummary(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bills/summary?${searchParams}`);
    return response.data;
  },

  async updateBill(billId, billData) {
    const response = await apiClient.put(`/bills/${billId}`, billData);
    return response.data;
  },

  // Bill Charges
  async getBillCharges(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/bill-charges?${searchParams}`);
    return response.data;
  },

  async getChargesByEpisode(episodeId) {
    const response = await apiClient.get(`/bill-charges/episode/${episodeId}`);
    return response.data;
  },

  async addCharge(chargeData) {
    const response = await apiClient.post('/bill-charges', chargeData);
    return response.data;
  },

  async addChargeFromMaster(chargeData) {
    const response = await apiClient.post('/bill-charges/from-master', chargeData);
    return response.data;
  },

  async updateCharge(chargeId, chargeData) {
    const response = await apiClient.put(`/bill-charges/${chargeId}`, chargeData);
    return response.data;
  },

  async deleteCharge(chargeId) {
    const response = await apiClient.delete(`/bill-charges/${chargeId}`);
    return response.data;
  },

  // Payments
  async getPayments(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/payments?${searchParams}`);
    return response.data;
  },

  async processBillPayment(paymentData) {
    const response = await apiClient.post('/payments/process-bill', paymentData);
    return response.data;
  },

  async createPayment(paymentData) {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  },

  async getPaymentSummary(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/payments/summary?${searchParams}`);
    return response.data;
  },

  // Advance Payments
  async getAdvancePayments(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/payment-advances?${searchParams}`);
    return response.data;
  },

  async createAdvancePayment(advanceData) {
    const response = await apiClient.post('/payment-advances', advanceData);
    return response.data;
  },

  async updateAdvancePayment(advanceId, advanceData) {
    const response = await apiClient.put(`/payment-advances/${advanceId}`, advanceData);
    return response.data;
  },

  // Refunds
  async getRefunds(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/refunds?${searchParams}`);
    return response.data;
  },

  async processRefund(refundData) {
    const response = await apiClient.post('/refunds', refundData);
    return response.data;
  },

  async updateRefund(refundId, refundData) {
    const response = await apiClient.put(`/refunds/${refundId}`, refundData);
    return response.data;
  },

  // Billing Episodes
  async getBillingEpisodes(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/billing-episodes?${searchParams}`);
    return response.data;
  },

  async getBillingEpisodeById(episodeId) {
    const response = await apiClient.get(`/billing-episodes/${episodeId}`);
    return response.data;
  },

  async createBillingEpisode(episodeData) {
    const response = await apiClient.post('/billing-episodes', episodeData);
    return response.data;
  },

  async updateBillingEpisode(episodeId, episodeData) {
    const response = await apiClient.put(`/billing-episodes/${episodeId}`, episodeData);
    return response.data;
  },

  // Charge Masters
  async getChargeMasters(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/charge-masters?${searchParams}`);
    return response.data;
  },

  async getChargeMasterById(chargeId) {
    const response = await apiClient.get(`/charge-masters/${chargeId}`);
    return response.data;
  },

  async createChargeMaster(chargeData) {
    const response = await apiClient.post('/charge-masters', chargeData);
    return response.data;
  },

  async updateChargeMaster(chargeId, chargeData) {
    const response = await apiClient.put(`/charge-masters/${chargeId}`, chargeData);
    return response.data;
  },

  async deleteChargeMaster(chargeId) {
    const response = await apiClient.delete(`/charge-masters/${chargeId}`);
    return response.data;
  },

  // Utility functions
  async searchPatients(searchTerm) {
    const response = await apiClient.get(`/patients?search=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  async getActiveAdmissions(patientId) {
    const response = await apiClient.get(`/ipd-admissions?patient_id=${patientId}&status=Active`);
    return response.data;
  },

  // Reports
  async getBillingReport(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/reports/billing?${searchParams}`);
    return response.data;
  },

  async getPaymentReport(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/reports/payments?${searchParams}`);
    return response.data;
  },

  async getRefundReport(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await apiClient.get(`/reports/refunds?${searchParams}`);
    return response.data;
  }
};

export default billingService;