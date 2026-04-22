import BaseService from './BaseService';

class IpdNurseAssignmentService extends BaseService {
  constructor() {
    super('/ipd-nurse-assignments');
  }
}

export default new IpdNurseAssignmentService();
