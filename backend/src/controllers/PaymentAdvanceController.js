const { PaymentAdvance, Patient, IpdAdmission, Hospital, User } = require('../models');

class PaymentAdvanceController {
  static async create(req, res) {
    try {
      const { patient_id, amount, payment_mode, received_by, hospital_id, utilized_amount, ...otherData } = req.body;
      
      if (!patient_id || !amount || !payment_mode || !received_by || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'patient_id, amount, payment_mode, received_by, and hospital_id are required' 
        });
      }

      // Generate receipt number
      const lastAdvance = await PaymentAdvance.findOne({ 
        order: [['advance_id', 'DESC']] 
      });
      const year = new Date().getFullYear();
      const nextNumber = lastAdvance ? parseInt(lastAdvance.receipt_number.split('-')[2]) + 1 : 1;
      const receipt_number = `ADV-${year}-${String(nextNumber).padStart(5, '0')}`;

      const util_amount = utilized_amount || 0;
      const balance_amount = amount - util_amount;

      const paymentAdvance = await PaymentAdvance.create({
        patient_id,
        amount,
        payment_mode,
        received_by,
        hospital_id,
        ...otherData,
        utilized_amount: util_amount,
        balance_amount,
        receipt_number
      });

      const patient = await Patient.findByPk(patient_id);
      const admission = paymentAdvance.admission_id ? await IpdAdmission.findByPk(paymentAdvance.admission_id) : null;
      const hospital = await Hospital.findByPk(hospital_id);
      const user = await User.findByPk(received_by, { attributes: { exclude: ['password'] } });

      res.status(201).json({ 
        success: true, 
        message: 'Payment advance created successfully',
        data: {
          ...paymentAdvance.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          admission: admission ? { admission_id: admission.admission_id, admission_date: admission.admission_date, status: admission.status } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          receivedBy: user ? { id: user.id, username: user.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { patient_id, admission_id } = req.query;
      const where = { is_active: true, hospital_id: req.hospitalId };
      
      if (patient_id) where.patient_id = patient_id;
      if (admission_id) where.admission_id = admission_id;

      const advances = await PaymentAdvance.findAll({ 
        where,
        order: [['advance_date', 'DESC']]
      });

      const advancesWithDetails = await Promise.all(
        advances.map(async (advance) => {
          const patient = await Patient.findByPk(advance.patient_id);
          const admission = advance.admission_id ? await IpdAdmission.findByPk(advance.admission_id) : null;
          const hospital = await Hospital.findByPk(advance.hospital_id);
          const user = await User.findByPk(advance.received_by, { attributes: { exclude: ['password'] } });
          
          return {
            ...advance.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
            admission: admission ? { admission_id: admission.admission_id, admission_date: admission.admission_date, status: admission.status } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            receivedBy: user ? { id: user.id, username: user.name } : null
          };
        })
      );

      res.json({ success: true, data: advancesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const paymentAdvance = await PaymentAdvance.findOne({ where: { advance_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!paymentAdvance) {
        return res.status(404).json({ success: false, message: 'Payment advance not found' });
      }

      const patient = await Patient.findByPk(paymentAdvance.patient_id);
      const admission = paymentAdvance.admission_id ? await IpdAdmission.findByPk(paymentAdvance.admission_id) : null;
      const hospital = await Hospital.findByPk(paymentAdvance.hospital_id);
      const user = await User.findByPk(paymentAdvance.received_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...paymentAdvance.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          admission: admission ? { admission_id: admission.admission_id, admission_date: admission.admission_date, status: admission.status } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          receivedBy: user ? { id: user.id, username: user.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { is_active, amount, utilized_amount, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await PaymentAdvance.update(
          { is_active: false },
          { where: { advance_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Payment advance not found' });
        }
        const deactivatedAdvance = await PaymentAdvance.findOne({ where: { advance_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Payment advance deactivated successfully', data: deactivatedAdvance });
      }

      const existingAdvance = await PaymentAdvance.findOne({ where: { advance_id: req.params.id, hospital_id: req.hospitalId } });
      if (!existingAdvance) {
        return res.status(404).json({ success: false, message: 'Payment advance not found' });
      }

      const amt = amount !== undefined ? amount : existingAdvance.amount;
      const util_amount = utilized_amount !== undefined ? utilized_amount : existingAdvance.utilized_amount;
      const balance_amount = amt - util_amount;

      const [updated] = await PaymentAdvance.update(
        { 
          ...updateData,
          amount: amt,
          utilized_amount: util_amount,
          balance_amount,
          is_active: is_active !== undefined ? is_active : true 
        },
        { where: { advance_id: req.params.id, hospital_id: req.hospitalId } }
      );

      const updatedAdvance = await PaymentAdvance.findOne({ where: { advance_id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedAdvance.patient_id);
      const admission = updatedAdvance.admission_id ? await IpdAdmission.findByPk(updatedAdvance.admission_id) : null;
      const hospital = await Hospital.findByPk(updatedAdvance.hospital_id);
      const user = await User.findByPk(updatedAdvance.received_by, { attributes: { exclude: ['password'] } });

      res.json({ 
        success: true, 
        data: {
          ...updatedAdvance.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name, uhid: patient.uhid } : null,
          admission: admission ? { admission_id: admission.admission_id, admission_date: admission.admission_date, status: admission.status } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          receivedBy: user ? { id: user.id, username: user.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await PaymentAdvance.destroy({
        where: { advance_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Payment advance not found' });
      }

      res.json({ success: true, message: 'Payment advance permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PaymentAdvanceController;
