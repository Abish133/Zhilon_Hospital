import BaseService from './BaseService';

class StockIssueService extends BaseService {
  constructor() {
    super('/stock-issues');
  }
}

export default new StockIssueService();
