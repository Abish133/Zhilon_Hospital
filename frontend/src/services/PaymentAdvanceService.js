import BaseService from './BaseService';

class PaymentAdvanceService extends BaseService {
  constructor() {
    super('/api/payment-advances');
  }

  getByPatient(patientId) {
    return this.getAll({ patient_id: patientId });
  }

  getByAdmission(admissionId) {
    return this.getAll({ admission_id: admissionId });
  }
}

export default new PaymentAdvanceService();