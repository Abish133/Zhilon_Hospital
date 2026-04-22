import BaseService from './BaseService';

class WardService extends BaseService {
  constructor() {
    super('/wards');
  }
}

export default new WardService();
