import BaseService from './BaseService';

class IpdDischargeSummaryService extends BaseService {
  constructor() {
    super('/ipd-discharge-summary');
  }
}

export default new IpdDischargeSummaryService();
