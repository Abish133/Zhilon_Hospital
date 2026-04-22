import BaseService from './BaseService';

class LabOrderDetailService extends BaseService {
  constructor() {
    super('/lab-order-details');
  }
}

export default new LabOrderDetailService();
