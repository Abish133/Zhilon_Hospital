import BaseService from './BaseService';

class IpdDischargeNursingSummaryService extends BaseService {
  constructor() {
    super('/ipd-discharge-nursing-summary');
  }
}

export default new IpdDischargeNursingSummaryService();