const { Medicine, Hospital } = require('../models');
const { Op } = require('sequelize');

class MedicineController {
  static async createMedicine(req, res) {
    try {
      const { hospital_id, medicine_name } = req.body;

      if (!hospital_id || !medicine_name) {
        return res.status(400).json({
          success: false,
          message: 'Hospital ID and medicine name are required'
        });
      }
 
      const medicine = await Medicine.create(req.body);
      const hospital = await Hospital.findByPk(hospital_id);
     
      res.status(201).json({
        success: true,
        data: {
          ...medicine.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllMedicines(req, res) {
    try {
      const medicines = await Medicine.findAll({
        where: { hospital_id: req.hospitalId }
      });
     
      const medicinesWithHospital = await Promise.all(
        medicines.map(async (medicine) => {
          const hospital = await Hospital.findByPk(medicine.hospital_id);
          return {
            ...medicine.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );
     
      res.json({ success: true, data: medicinesWithHospital });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  // Search by name, code, or manufacturer. Mirrors the /search convention used
  // by patients (reads ?q=, returns { success, data }). Must be mounted BEFORE
  // the '/:id' route so 'search' isn't swallowed as an id.
  static async searchMedicines(req, res) {
    try {
      const { q } = req.query;
      if (!q || !String(q).trim()) {
        return res.status(400).json({ success: false, message: 'Search query is required' });
      }
      const term = String(q).trim();

      const medicines = await Medicine.findAll({
        where: {
          hospital_id: req.hospitalId,
          [Op.or]: [
            { medicine_name: { [Op.like]: `%${term}%` } },
            { medicine_code: { [Op.like]: `%${term}%` } },
            { manufacturer: { [Op.like]: `%${term}%` } }
          ]
        },
        limit: 50
      });

      const medicinesWithHospital = await Promise.all(
        medicines.map(async (medicine) => {
          const hospital = await Hospital.findByPk(medicine.hospital_id);
          return {
            ...medicine.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: medicinesWithHospital });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMedicineById(req, res) {
    try {
      const medicine = await Medicine.findOne({
        where: {
          medicine_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!medicine) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }
     
      const hospital = await Hospital.findByPk(medicine.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...medicine.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateMedicine(req, res) {
    try {
      const [updated] = await Medicine.update(req.body, {
        where: { 
          medicine_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }
      const updatedMedicine = await Medicine.findOne({
        where: {
          medicine_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      const hospital = await Hospital.findByPk(updatedMedicine.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...updatedMedicine.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteMedicine(req, res) {
    try {
      const deleted = await Medicine.destroy({
        where: { 
          medicine_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
      }
      res.json({ success: true, message: 'Medicine deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = MedicineController;
 
 