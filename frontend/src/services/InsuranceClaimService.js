import BaseService from './BaseService';

class InsuranceClaimService extends BaseService {
  constructor() {
    super('/insurance-claims');
  }

  createClaim(billId, insuranceData) {
    return this.post('/', {
      bill_id: billId,
      insurance_provider: insuranceData.provider,
      policy_number: insuranceData.policyNumber,
      member_id: insuranceData.memberId || null,
      claim_amount: insuranceData.claimAmount,
      deductible: insuranceData.deductible || 0,
      copay: insuranceData.copay || 0,
      hospital_id: insuranceData.hospitalId
    });
  }

  getClaims(filters = {}) {
    return this.get('/', { params: filters });
  }

  getClaimsByStatus(status) {
    return this.get('/', { params: { status } });
  }

  getClaimById(id) {
    return this.get(`/${id}`);
  }

  getByPatient(patientId) {
    return this.get(`/patient/${patientId}`);
  }

  submitClaim(id, submissionDate) {
    return this.post(`/${id}/submit`, {
      submission_date: submissionDate
    });
  }

  approveClaim(id, approvalData) {
    return this.post(`/${id}/approve`, {
      approved_amount: approvalData.approvedAmount,
      approval_date: approvalData.approvalDate,
      remarks: approvalData.remarks
    });
  }

  rejectClaim(id, rejectionReason) {
    return this.post(`/${id}/reject`, {
      rejection_reason: rejectionReason
    });
  }

  processPayment(id, paymentData) {
    return this.post(`/${id}/payment`, {
      payment_amount: paymentData.amount,
      payment_date: paymentData.date,
      reference_number: paymentData.reference
    });
  }

  trackClaim(id) {
    return this.get(`/${id}/track`);
  }

  getClaimStats(hospitalId = null) {
    const params = hospitalId ? { hospital_id: hospitalId } : {};
    return this.get('/stats', { params });
  }
}

export default new InsuranceClaimService();
