import BaseService from './BaseService';

class StockReturnService extends BaseService {
  constructor() {
    super('/stock-returns');
  }
}

export default new StockReturnService();
