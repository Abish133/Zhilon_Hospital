const { BillingEpisode, Patient, Hospital, OpdVisit, IpdAdmission, Bill } = require('../models');
const { Op } = require('sequelize');

class BillingEpisodeController {
  static async create(req, res) {
    try {
      const { patient_id, episode_type, hospital_id } = req.body;
      
      if (!patient_id || !episode_type || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'patient_id, episode_type, and hospital_id are required' 
        });
      }

      const billingEpisode = await BillingEpisode.create(req.body);
      const patient = await Patient.findByPk(patient_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const opdVisit = billingEpisode.opd_visit_id ? await OpdVisit.findByPk(billingEpisode.opd_visit_id) : null;
      const ipdAdmission = billingEpisode.admission_id ? await IpdAdmission.findByPk(billingEpisode.admission_id) : null;

      res.status(201).json({ 
        success: true, 
        message: 'Billing episode created successfully',
        data: {
          ...billingEpisode.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          opdVisit: opdVisit ? { visit_id: opdVisit.visit_id, visit_date: opdVisit.visit_date } : null,
          ipdAdmission: ipdAdmission ? { admission_id: ipdAdmission.admission_id, admission_date: ipdAdmission.admission_date } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { status, episode_type, patient_id } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };

      if (status) where.status = status;
      if (episode_type) where.episode_type = episode_type;
      if (patient_id) where.patient_id = patient_id;

      const episodes = await BillingEpisode.findAll({ 
        where,
        order: [['start_date', 'DESC']]
      });

      const episodesWithDetails = await Promise.all(
        episodes.map(async (episode) => {
          const patient = await Patient.findByPk(episode.patient_id);
          const hospital = await Hospital.findByPk(episode.hospital_id);
          const opdVisit = episode.opd_visit_id ? await OpdVisit.findByPk(episode.opd_visit_id) : null;
          const ipdAdmission = episode.admission_id ? await IpdAdmission.findByPk(episode.admission_id) : null;
          
          return {
            ...episode.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            opdVisit: opdVisit ? { visit_id: opdVisit.visit_id, visit_date: opdVisit.visit_date } : null,
            ipdAdmission: ipdAdmission ? { admission_id: ipdAdmission.admission_id, admission_date: ipdAdmission.admission_date } : null
          };
        })
      );

      res.json({ success: true, data: episodesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const billingEpisode = await BillingEpisode.findOne({ where: { episode_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!billingEpisode) {
        return res.status(404).json({ success: false, message: 'Billing episode not found' });
      }

      const patient = await Patient.findByPk(billingEpisode.patient_id);
      const hospital = await Hospital.findByPk(billingEpisode.hospital_id);
      const opdVisit = billingEpisode.opd_visit_id ? await OpdVisit.findByPk(billingEpisode.opd_visit_id) : null;
      const ipdAdmission = billingEpisode.admission_id ? await IpdAdmission.findByPk(billingEpisode.admission_id) : null;

      res.json({ 
        success: true, 
        data: {
          ...billingEpisode.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          opdVisit: opdVisit ? { visit_id: opdVisit.visit_id, visit_date: opdVisit.visit_date } : null,
          ipdAdmission: ipdAdmission ? { admission_id: ipdAdmission.admission_id, admission_date: ipdAdmission.admission_date } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await BillingEpisode.update(
          { is_active: false },
          { where: { episode_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Billing episode not found' });
        }
        const deactivatedEpisode = await BillingEpisode.findOne({ where: { episode_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Billing episode deactivated successfully', data: deactivatedEpisode });
      }

      const [updated] = await BillingEpisode.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { episode_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Billing episode not found' });
      }

      const updatedEpisode = await BillingEpisode.findOne({ where: { episode_id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedEpisode.patient_id);
      const hospital = await Hospital.findByPk(updatedEpisode.hospital_id);
      const opdVisit = updatedEpisode.opd_visit_id ? await OpdVisit.findByPk(updatedEpisode.opd_visit_id) : null;
      const ipdAdmission = updatedEpisode.admission_id ? await IpdAdmission.findByPk(updatedEpisode.admission_id) : null;

      res.json({ 
        success: true, 
        data: {
          ...updatedEpisode.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          opdVisit: opdVisit ? { visit_id: opdVisit.visit_id, visit_date: opdVisit.visit_date } : null,
          ipdAdmission: ipdAdmission ? { admission_id: ipdAdmission.admission_id, admission_date: ipdAdmission.admission_date } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await BillingEpisode.destroy({
        where: { episode_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Billing episode not found' });
      }

      res.json({ success: true, message: 'Billing episode permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get unbilled episodes (episodes without bills)
  static async getUnbilled(req, res) {
    try {
      // Get all episode IDs that have bills
      const billedEpisodes = await Bill.findAll({ where: { is_active: true, hospital_id: req.hospitalId },
        attributes: ['episode_id']
      });
      
      const billedEpisodeIds = billedEpisodes.map(b => b.episode_id);

      // Get episodes that don't have bills
      const where = {
        is_active: true,
        status: 'Open'
      };

      if (billedEpisodeIds.length > 0) {
        where.episode_id = { [Op.notIn]: billedEpisodeIds };
      }

      const episodes = await BillingEpisode.findAll({
        where,
        include: [
          { model: Patient, as: 'patient' },
          { model: OpdVisit, as: 'opdVisit' },
          { model: IpdAdmission, as: 'ipdAdmission' }
        ],
        order: [['start_date', 'DESC']]
      });

      res.json({ success: true, data: episodes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = BillingEpisodeController;
