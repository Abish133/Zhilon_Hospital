const { IpdNurseAssignment, IpdAdmission, Patient, Employee, Ward, Hospital } = require('../models');

class IpdNurseAssignmentController {
  static async createAssignment(req, res) {
    try {
      const { admission_id, patient_id, nurse_id, ward_id, shift, assigned_from, assigned_to, is_primary_nurse, status, hospital_id } = req.body;
      
      if (!admission_id || !patient_id || !nurse_id || !ward_id || !shift || !assigned_from || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'admission_id, patient_id, nurse_id, ward_id, shift, assigned_from, and hospital_id are required' 
        });
      }

      const assignment = await IpdNurseAssignment.create({ 
        admission_id, 
        patient_id, 
        nurse_id, 
        ward_id, 
        shift, 
        assigned_from, 
        assigned_to,
        is_primary_nurse: is_primary_nurse || false,
        status: status || 'Active',
        hospital_id 
      });
      
      const hospital = await Hospital.findByPk(hospital_id);
      const patient = await Patient.findByPk(patient_id);
      const nurse = await Employee.findByPk(nurse_id);
      const ward = await Ward.findByPk(ward_id);
      const admission = await IpdAdmission.findByPk(admission_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Nurse assignment created successfully',
        data: {
          ...assignment.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          nurse: nurse ? { employee_id: nurse.employee_id, full_name: nurse.full_name, role: nurse.role } : null,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null,
          admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllAssignments(req, res) {
    try {
      const assignments = await IpdNurseAssignment.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });
      
      const assignmentsWithDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const hospital = await Hospital.findByPk(assignment.hospital_id);
          const patient = await Patient.findByPk(assignment.patient_id);
          const nurse = await Employee.findByPk(assignment.nurse_id);
          const ward = await Ward.findByPk(assignment.ward_id);
          const admission = await IpdAdmission.findByPk(assignment.admission_id);
          return {
            ...assignment.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            nurse: nurse ? { employee_id: nurse.employee_id, full_name: nurse.full_name, role: nurse.role } : null,
            ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null,
            admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null
          };
        })
      );
      
      res.json({ success: true, data: assignmentsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAssignmentById(req, res) {
    try {
      const assignment = await IpdNurseAssignment.findOne({ where: { assignment_id: req.params.id, hospital_id: req.hospitalId } });
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }
      
      const hospital = await Hospital.findByPk(assignment.hospital_id);
      const patient = await Patient.findByPk(assignment.patient_id);
      const nurse = await Employee.findByPk(assignment.nurse_id);
      const ward = await Ward.findByPk(assignment.ward_id);
      const admission = await IpdAdmission.findByPk(assignment.admission_id);
      
      res.json({ 
        success: true, 
        data: {
          ...assignment.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          nurse: nurse ? { employee_id: nurse.employee_id, full_name: nurse.full_name, role: nurse.role } : null,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null,
          admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateAssignment(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      
      if (is_active === 0 || is_active === false) {
        const [updated] = await IpdNurseAssignment.update(
          { is_active: false },
          { where: { assignment_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        const deactivatedAssignment = await IpdNurseAssignment.findOne({ where: { assignment_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ 
          success: true, 
          message: 'Assignment deactivated successfully', 
          data: deactivatedAssignment
        });
      }
      
      const [updated] = await IpdNurseAssignment.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { assignment_id: req.params.id, hospital_id: req.hospitalId } }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }
      const updatedAssignment = await IpdNurseAssignment.findOne({ where: { assignment_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedAssignment.hospital_id);
      const patient = await Patient.findByPk(updatedAssignment.patient_id);
      const nurse = await Employee.findByPk(updatedAssignment.nurse_id);
      const ward = await Ward.findByPk(updatedAssignment.ward_id);
       const admission = await IpdAdmission.findByPk(updatedAssignment.admission_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedAssignment.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          nurse: nurse ? { employee_id: nurse.employee_id, full_name: nurse.full_name, role: nurse.role } : null,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null,
           admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteAssignment(req, res) {
    try {
      const deleted = await IpdNurseAssignment.destroy({
        where: { assignment_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }
      res.json({ success: true, message: 'Assignment permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = IpdNurseAssignmentController;
