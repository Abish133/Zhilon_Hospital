const { IpdProgressNote, IpdAdmission, Patient, User, Hospital } = require('../models');

class IpdProgressNoteController {
  static async createProgressNote(req, res) {
    try {
      const { admission_id, patient_id, progress_date, progress_time, note_type, doctor_notes, nursing_notes, vitals, intake_output, recorded_by, recorded_at, hospital_id } = req.body;
      
      if (!admission_id || !patient_id || !progress_date || !progress_time || !note_type || !recorded_by || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'admission_id, patient_id, progress_date, progress_time, note_type, recorded_by, and hospital_id are required' 
        });
      }

      const progressNote = await IpdProgressNote.create({ 
        admission_id,
        patient_id,
        progress_date,
        progress_time,
        note_type,
        doctor_notes,
        nursing_notes,
        vitals,
        intake_output,
        recorded_by,
        recorded_at: recorded_at || new Date(),
        hospital_id
      });

      const admission = await IpdAdmission.findByPk(admission_id);
      const patient = await Patient.findByPk(patient_id);
      const user = await User.findByPk(recorded_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Progress note created successfully',
        data: {
          ...progressNote.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, status: admission.status } : null,
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          recordedBy: user ? { id: user.id, name: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllProgressNotes(req, res) {
    try {
      const { admission_id } = req.query;
      const whereClause = { is_active: true, hospital_id: req.hospitalId };

      if (admission_id) {
        whereClause.admission_id = admission_id;
      }

      const progressNotes = await IpdProgressNote.findAll({
        where: whereClause,
        order: [['recorded_at', 'DESC']]
      });

      const notesWithDetails = await Promise.all(
        progressNotes.map(async (note) => {
          const admission = await IpdAdmission.findByPk(note.admission_id);
          const user = await User.findByPk(note.recorded_by, { attributes: { exclude: ['password'] } });
          const hospital = await Hospital.findByPk(note.hospital_id);
          const patient = await Patient.findByPk(note.patient_id);
          return {
            ...note.toJSON(),
            admission: admission ? { admission_id: admission.admission_id, patient_id: admission.patient_id, status: admission.status } : null,
            recordedBy: user ? { id: user.id, name: user.name, role: user.role } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          };
        })
      );

      res.json({ success: true, data: notesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getProgressNoteById(req, res) {
    try {
      const progressNote = await IpdProgressNote.findOne({ where: { note_id: req.params.id, hospital_id: req.hospitalId } });

      if (!progressNote) {
        return res.status(404).json({ success: false, message: 'Progress note not found' });
      }

      const admission = await IpdAdmission.findByPk(progressNote.admission_id);
      const user = await User.findByPk(progressNote.recorded_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(progressNote.hospital_id);
      const patient = await Patient.findByPk(progressNote.patient_id);
      res.json({ 
        success: true, 
        data: {
          ...progressNote.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, patient_id: admission.patient_id, status: admission.status } : null,
          recordedBy: user ? { id: user.id, name: user.name, role: user.role } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateProgressNote(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await IpdProgressNote.update(
          { is_active: false },
          { where: { progress_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Progress note not found' });
        }
        const deactivatedNote = await IpdProgressNote.findOne({ where: { note_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Progress note deactivated successfully', data: deactivatedNote });
      }

      const [updated] = await IpdProgressNote.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { progress_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Progress note not found' });
      }

      const updatedNote = await IpdProgressNote.findOne({ where: { note_id: req.params.id, hospital_id: req.hospitalId } });
      const admission = await IpdAdmission.findByPk(updatedNote.admission_id);
      const user = await User.findByPk(updatedNote.recorded_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(updatedNote.hospital_id);
 const patient = await Patient.findByPk(updatedNote.patient_id);
      res.json({ 
        success: true, 
        data: {
          ...updatedNote.toJSON(),
          admission: admission ? { admission_id: admission.admission_id, patient_id: admission.patient_id, status: admission.status } : null,
          recordedBy: user ? { id: user.id, name: user.name, role: user.role } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteProgressNote(req, res) {
    try {
      const deleted = await IpdProgressNote.destroy({
        where: { progress_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Progress note not found' });
      }

      res.json({ success: true, message: 'Progress note permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = IpdProgressNoteController;
