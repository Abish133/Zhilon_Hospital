import BaseService from './BaseService';

class PharmacySaleDetailService extends BaseService {
  constructor() {
    super('/pharmacy-sale-details');
  }
}

export default new PharmacySaleDetailService();
