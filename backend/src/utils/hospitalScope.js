/**
 * Hospital Scope Utility
 * Ensures all database queries are scoped to the authenticated user's hospital
 */

/**
 * Add hospital_id to where clause
 * @param {Object} where - Existing where clause
 * @param {Number} hospitalId - Hospital ID from req.hospitalId
 * @returns {Object} Updated where clause with hospital_id
 */
const addHospitalScope = (where, hospitalId) => {
  if (!hospitalId) {
    throw new Error('Hospital ID is required for scoped queries');
  }
  return {
    ...where,
    hospital_id: hospitalId
  };
};

/**
 * Create a scoped where clause for findOne/findAll operations
 * @param {Number|String} id - Record ID
 * @param {String} idField - Name of the ID field (e.g., 'patient_id', 'id')
 * @param {Number} hospitalId - Hospital ID from req.hospitalId
 * @returns {Object} Where clause with hospital scope
 */
const scopedWhere = (id, idField, hospitalId) => {
  if (!hospitalId) {
    throw new Error('Hospital ID is required for scoped queries');
  }
  return {
    [idField]: id,
    hospital_id: hospitalId
  };
};

/**
 * Validate that a record belongs to the user's hospital
 * @param {Object} record - Database record
 * @param {Number} hospitalId - Hospital ID from req.hospitalId
 * @throws {Error} If record doesn't belong to hospital
 */
const validateHospitalOwnership = (record, hospitalId) => {
  if (!record) {
    throw new Error('Record not found');
  }
  if (record.hospital_id !== hospitalId) {
    throw new Error('Access denied: Record belongs to different hospital');
  }
};

/**
 * Controller-friendly multi-tenant guard. Use after fetching by primary key:
 *
 *   const bill = await Bill.findByPk(req.params.id);
 *   if (!ensureSameHospital(req, res, bill)) return;
 *
 * Returns true if the caller may proceed; otherwise sends a 404 (NOT 403, to
 * avoid leaking the existence of records that belong to another hospital) and
 * returns false. If the record has no hospital_id (global master) or the
 * caller has none (system admin without tenant), passes through.
 */
const ensureSameHospital = (req, res, record, opts = {}) => {
  const { notFoundMessage = 'Record not found' } = opts;
  if (!record) {
    res.status(404).json({ success: false, message: notFoundMessage });
    return false;
  }
  const callerHospitalId = req.user?.hospital_id;
  if (callerHospitalId == null) return true;
  if (record.hospital_id == null) return true;
  if (String(record.hospital_id) !== String(callerHospitalId)) {
    res.status(404).json({ success: false, message: notFoundMessage });
    return false;
  }
  return true;
};

module.exports = {
  addHospitalScope,
  scopedWhere,
  validateHospitalOwnership,
  ensureSameHospital
};
