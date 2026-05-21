import BaseService from './BaseService';
import apiClient from '@config/api';

class PharmacyService extends BaseService {
  constructor() {
    super('/pharmacy');
  }

  // Dispensing is served by POST /api/pharmacy/sales/dispense (see
  // PharmacySaleController.dispenseMedicine). Keep this in sync with
  // PharmacySaleService.dispense, which is what the UI actually calls.
  dispense(data) {
    return apiClient.post('/pharmacy/sales/dispense', data);
  }
}

export default new PharmacyService();
