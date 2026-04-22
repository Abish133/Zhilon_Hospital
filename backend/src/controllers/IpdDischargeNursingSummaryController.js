const { IpdDischargeNursingSummary, IpdAdmission, Employee, Hospital } = require('../models');

class IpdDischargeNursingSummaryController {
  static async createNursingSummary(req, res) {
    try {
      const { admission_id, primary_nurse_id, last_shift_nurse_id, patient_condition_at_discharge, vitals_at_discharge, wound_status, catheter_status, iv_line_status, discharge_education_given, nurse_remarks, recorded_at, hospital_id } = req.body;
      
      if (!admission_id || !primary_nurse_id || !last_shift_nurse_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Admission, primary nurse, last shift nurse, and hospital are required' 
        });
      }

      const nursingSummary = await IpdDischargeNursingSummary.create({ 
        admission_id,
        primary_nurse_id,
        last_shift_nurse_id,
        patient_condition_at_discharge,
        vitals_at_discharge,
        wound_status,
        catheter_status,
        iv_line_status,
        discharge_education_given: discharge_education_given || false,
        nurse_remarks,
        recorded_at: recorded_at || new Date(),
        hospital_id
      });

      const admission = await IpdAdmission.findByPk(admission_id);
      const primaryNurse = await Employee.findByPk(primary_nurse_id);
      const lastShiftNurse = await Employee.findByPk(last_shift_nurse_id);
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Nursing discharge summary created successfully',
        data: {
          ...nursingSummary.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, patient_id: admission.patient_id } : null,
          primaryNurse: primaryNurse ? { employee_id: primaryNurse.employee_id, full_name: primaryNurse.full_name } : null,
          lastShiftNurse: lastShiftNurse ? { employee_id: lastShiftNurse.employee_id, full_name: lastShiftNurse.full_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllNursingSummaries(req, res) {
    try {
      const summaries = await IpdDischargeNursingSummary.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });

      const summariesWithDetails = await Promise.all(
        summaries.map(async (summary) => {
          const admission = await IpdAdmission.findByPk(summary.admission_id);
          const primaryNurse = await Employee.findByPk(summary.primary_nurse_id);
          const lastShiftNurse = await Employee.findByPk(summary.last_shift_nurse_id);
          const hospital = await Hospital.findByPk(summary.hospital_id);
          
          return {
            ...summary.toJSON(),
            admission: admission ? { admission_id: admission.admission_id, patient_id: admission.patient_id } : null,
            primaryNurse: primaryNurse ? { employee_id: primaryNurse.employee_id, full_name: primaryNurse.full_name } : null,
            lastShiftNurse: lastShiftNurse ? { employee_id: lastShiftNurse.employee_id, full_name: lastShiftNurse.full_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: summariesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getNursingSummaryById(req, res) {
    try {
      const summary = await IpdDischargeNursingSummary.findOne({ where: { summary_id: req.params.id, hospital_id: req.hospitalId } });

      if (!summary) {
        return res.status(404).json({ success: false, message: 'Nursing discharge summary not found' });
      }

      const admission = await IpdAdmission.findByPk(summary.admission_id);
      const primaryNurse = await Employee.findByPk(summary.primary_nurse_id);
      const lastShiftNurse = await Employee.findByPk(summary.last_shift_nurse_id);
      const hospital = await Hospital.findByPk(summary.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...summary.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, patient_id: admission.patient_id } : null,
          primaryNurse: primaryNurse ? { employee_id: primaryNurse.employee_id, full_name: primaryNurse.full_name } : null,
          lastShiftNurse: lastShiftNurse ? { employee_id: lastShiftNurse.employee_id, full_name: lastShiftNurse.full_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateNursingSummary(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await IpdDischargeNursingSummary.update(
          { is_active: false },
          { where: { discharge_nurse_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Nursing discharge summary not found' });
        }
        const deactivatedSummary = await IpdDischargeNursingSummary.findOne({ where: { summary_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Nursing discharge summary deactivated successfully', data: deactivatedSummary });
      }

      const [updated] = await IpdDischargeNursingSummary.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { discharge_nurse_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Nursing discharge summary not found' });
      }

      const updatedSummary = await IpdDischargeNursingSummary.findOne({ where: { summary_id: req.params.id, hospital_id: req.hospitalId } });
      const admission = await IpdAdmission.findByPk(updatedSummary.admission_id);
      const primaryNurse = await Employee.findByPk(updatedSummary.primary_nurse_id);
      const lastShiftNurse = await Employee.findByPk(updatedSummary.last_shift_nurse_id);
      const hospital = await Hospital.findByPk(updatedSummary.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedSummary.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, patient_id: admission.patient_id } : null,
          primaryNurse: primaryNurse ? { employee_id: primaryNurse.employee_id, full_name: primaryNurse.full_name } : null,
          lastShiftNurse: lastShiftNurse ? { employee_id: lastShiftNurse.employee_id, full_name: lastShiftNurse.full_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteNursingSummary(req, res) {
    try {
      const deleted = await IpdDischargeNursingSummary.destroy({
        where: { discharge_nurse_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Nursing discharge summary not found' });
      }

      res.json({ success: true, message: 'Nursing discharge summary permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = IpdDischargeNursingSummaryController;
