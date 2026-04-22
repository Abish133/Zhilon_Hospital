import BaseService from './BaseService';

class BedService extends BaseService {
  constructor() {
    super('/beds');
  }
}

export default new BedService();
