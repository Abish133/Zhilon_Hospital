const { RadiologyOrders, Patient, RadiologyTests, Doctor, BillingEpisode, BillCharge } = require('../models');

class RadiologyOrdersController {
  static async createRadiologyOrder(req, res) {
    try {
      if (!req.body.patient_id) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }
      if (!req.body.rad_test_id) {
        return res.status(400).json({
          success: false,
          message: 'Radiology test ID is required'
        });
      }

      const radiologyOrder = await RadiologyOrders.create(req.body);
      const patient = await Patient.findByPk(req.body.patient_id);
      const radiologyTest = await RadiologyTests.findByPk(req.body.rad_test_id);
      const orderedBy = await Doctor.findByPk(req.body.ordered_by);

      if (req.body.visit_id && radiologyTest && radiologyTest.charge) {
        const episodeWhere = req.body.visit_type === 'IPD'
          ? { admission_id: req.body.visit_id, status: 'Open' }
          : { opd_visit_id: req.body.visit_id, status: 'Open' };
        const billingEpisode = await BillingEpisode.findOne({ where: episodeWhere });

        if (billingEpisode) {
          const rate = parseFloat(radiologyTest.charge);
          const quantity = 1;
          const amount = rate * quantity;
          const gstPercent = 0;
          const taxableAmount = amount;
          const gstAmount = (taxableAmount * gstPercent) / 100;
          const netAmount = taxableAmount + gstAmount;

          await BillCharge.create({
            episode_id: billingEpisode.episode_id,
            hospital_id: req.body.hospital_id,
            charge_date: new Date(),
            service_type: 'Investigation',
            service_id: radiologyOrder.rad_order_id,
            description: `Radiology - ${radiologyTest.test_name}`,
            quantity,
            rate,
            amount,
            discount_percent: 0,
            discount_amount: 0,
            taxable_amount: taxableAmount,
            gst_percent: gstPercent,
            gst_amount: gstAmount,
            net_amount: netAmount
          });
        }
      }
     
      res.status(201).json({
        success: true,
        data: {
          ...radiologyOrder.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          radiologyTest: radiologyTest ? { rad_test_id: radiologyTest.rad_test_id, test_name: radiologyTest.test_name } : null,
          orderedBy: orderedBy ? { id: orderedBy.id, first_name: orderedBy.first_name, last_name: orderedBy.last_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllRadiologyOrders(req, res) {
    try {
      const radiologyOrders = await RadiologyOrders.findAll({
        where: { hospital_id: req.hospitalId }
      });
     
      const ordersWithDetails = await Promise.all(
        radiologyOrders.map(async (order) => {
          const patient = await Patient.findByPk(order.patient_id);
          const radiologyTest = await RadiologyTests.findByPk(order.rad_test_id);
          const orderedBy = await Doctor.findByPk(order.ordered_by);
          return {
            ...order.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            radiologyTest: radiologyTest ? { rad_test_id: radiologyTest.rad_test_id, test_name: radiologyTest.test_name } : null,
            orderedBy: orderedBy ? { id: orderedBy.id, first_name: orderedBy.first_name, last_name: orderedBy.last_name } : null
          };
        })
      );
     
      res.json({ success: true, data: ordersWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRadiologyOrderById(req, res) {
    try {
      const radiologyOrder = await RadiologyOrders.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      if (!radiologyOrder) {
        return res.status(404).json({ success: false, message: 'Radiology order not found' });
      }
     
      const patient = await Patient.findByPk(radiologyOrder.patient_id);
      const radiologyTest = await RadiologyTests.findByPk(radiologyOrder.rad_test_id);
      const orderedBy = await Doctor.findByPk(radiologyOrder.ordered_by);
     
      res.json({
        success: true,
        data: {
          ...radiologyOrder.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          radiologyTest: radiologyTest ? { rad_test_id: radiologyTest.rad_test_id, test_name: radiologyTest.test_name } : null,
          orderedBy: orderedBy ? { id: orderedBy.id, first_name: orderedBy.first_name, last_name: orderedBy.last_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateRadiologyOrder(req, res) {
    try {
      const [updated] = await RadiologyOrders.update(req.body, {
        where: { rad_order_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Radiology order not found' });
      }
      const updatedOrder = await RadiologyOrders.findOne({ where: { id: req.params.id, hospital_id: req.hospitalId } });
      const patient = await Patient.findByPk(updatedOrder.patient_id);
      const radiologyTest = await RadiologyTests.findByPk(updatedOrder.rad_test_id);
      const orderedBy = await Doctor.findByPk(updatedOrder.ordered_by);
     
      res.json({
        success: true,
        data: {
          ...updatedOrder.toJSON(),
          patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
          radiologyTest: radiologyTest ? { rad_test_id: radiologyTest.rad_test_id, test_name: radiologyTest.test_name } : null,
          orderedBy: orderedBy ? { id: orderedBy.id, first_name: orderedBy.first_name, last_name: orderedBy.last_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteRadiologyOrder(req, res) {
    try {
      const deleted = await RadiologyOrders.destroy({
        where: { rad_order_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Radiology order not found' });
      }
      res.json({ success: true, message: 'Radiology order deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRadiologyOrdersByPatientId(req, res) {
    try {
      const radiologyOrders = await RadiologyOrders.findAll({
        where: { 
          patient_id: req.params.patientId,
          hospital_id: req.hospitalId
        },
        order: [['order_date', 'DESC']]
      });
     
      const ordersWithDetails = await Promise.all(
        radiologyOrders.map(async (order) => {
          const patient = await Patient.findByPk(order.patient_id);
          const radiologyTest = await RadiologyTests.findByPk(order.rad_test_id);
          const orderedBy = await Doctor.findByPk(order.ordered_by);
          return {
            ...order.toJSON(),
            patient: patient ? { patient_id: patient.patient_id, first_name: patient.first_name, last_name: patient.last_name } : null,
            radiologyTest: radiologyTest ? { rad_test_id: radiologyTest.rad_test_id, test_name: radiologyTest.test_name } : null,
            orderedBy: orderedBy ? { id: orderedBy.id, first_name: orderedBy.first_name, last_name: orderedBy.last_name } : null
          };
        })
      );
     
      res.json({ success: true, data: ordersWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RadiologyOrdersController;