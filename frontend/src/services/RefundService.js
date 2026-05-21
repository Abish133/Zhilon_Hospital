import BaseService from './BaseService';

class RefundService extends BaseService {
  constructor() {
    super('/refunds');
  }

  getByPatient(patientId) {
    return this.getAll({ patient_id: patientId });
  }

  getByBill(billId) {
    return this.getAll({ bill_id: billId });
  }
}

export default new RefundService();