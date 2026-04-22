import BaseService from './BaseService';

class MedicineBatchService extends BaseService {
  constructor() {
    super('/medicine-batch');
  }
}

export default new MedicineBatchService();
