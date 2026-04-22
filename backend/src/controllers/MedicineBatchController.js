const { MedicineBatch, Medicine, Hospital, Vendor } = require('../models');
 
class MedicineBatchController {
  static async createMedicineBatch(req, res) {
    try {
      const { medicine_id, hospital_id, batch_number, received_quantity } = req.body;
      
      if (!medicine_id || !hospital_id || !batch_number || !received_quantity) {
        return res.status(400).json({
          success: false,
          message: 'medicine_id, hospital_id, batch_number, and received_quantity are required'
        });
      }
 
      const medicineBatch = await MedicineBatch.create(req.body);
      const medicine = await Medicine.findByPk(medicine_id);
      const hospital = await Hospital.findByPk(hospital_id);
      const vendor = req.body.vendor_id ? await Vendor.findByPk(req.body.vendor_id) : null;
     
      res.status(201).json({
        success: true,
        data: {
          ...medicineBatch.toJSON(),
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllMedicineBatches(req, res) {
    try {
      const medicineBatches = await MedicineBatch.findAll({
        where: { hospital_id: req.hospitalId }
      });
     
      const batchesWithDetails = await Promise.all(
        medicineBatches.map(async (batch) => {
          const medicine = await Medicine.findByPk(batch.medicine_id);
          const hospital = await Hospital.findByPk(batch.hospital_id);
          const vendor = batch.vendor_id ? await Vendor.findByPk(batch.vendor_id) : null;
          return {
            ...batch.toJSON(),
            medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            vendor: vendor ? { vendor_id: vendor.vendor_id, vendor_name: vendor.vendor_name } : null
          };
        })
      );
     
      res.json({ success: true, data: batchesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getMedicineBatchById(req, res) {
    try {
      const medicineBatch = await MedicineBatch.findOne({ where: { batch_id: req.params.id, hospital_id: req.hospitalId } });
      if (!medicineBatch) {
        return res.status(404).json({ success: false, message: 'Medicine batch not found' });
      }
     
      const medicine = await Medicine.findByPk(medicineBatch.medicine_id);
      const hospital = await Hospital.findByPk(medicineBatch.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...medicineBatch.toJSON(),
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateMedicineBatch(req, res) {
    try {
      const [updated] = await MedicineBatch.update(req.body, {
        where: { batch_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Medicine batch not found' });
      }
      const updatedBatch = await MedicineBatch.findOne({ where: { batch_id: req.params.id, hospital_id: req.hospitalId } });
      const medicine = await Medicine.findByPk(updatedBatch.medicine_id);
      const hospital = await Hospital.findByPk(updatedBatch.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...updatedBatch.toJSON(),
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteMedicineBatch(req, res) {
    try {
      const deleted = await MedicineBatch.destroy({
        where: { batch_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Medicine batch not found' });
      }
      res.json({ success: true, message: 'Medicine batch deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = MedicineBatchController;
 
 