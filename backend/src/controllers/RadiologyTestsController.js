const { RadiologyTests } = require('../models');

class RadiologyTestsController {
  static async createRadiologyTest(req, res) {
    try {
      if (!req.body.test_code) {
        return res.status(400).json({ success: false, message: 'Test code is required' });
      }
      if (!req.body.test_name) {
        return res.status(400).json({ success: false, message: 'Test name is required' });
      }

      const hospital_id = req.user?.hospital_id;
      const radiologyTest = await RadiologyTests.create({ ...req.body, hospital_id });
      res.status(201).json({ success: true, data: radiologyTest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllRadiologyTests(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const radiologyTests = await RadiologyTests.findAll({
        where: hospital_id ? { hospital_id } : {}
      });
      res.json({ success: true, data: radiologyTests });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRadiologyTestById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const radiologyTest = await RadiologyTests.findOne({ where: { rad_test_id: req.params.id, hospital_id: req.hospitalId } });
      if (!radiologyTest || (hospital_id && radiologyTest.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'Radiology test not found' });
      }
      res.json({ success: true, data: radiologyTest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateRadiologyTest(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { rad_test_id: req.params.id, hospital_id }
        : { rad_test_id: req.params.id };
      const [updated] = await RadiologyTests.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Radiology test not found' });
      }
      const updatedTest = await RadiologyTests.findOne({ where: { rad_test_id: req.params.id, hospital_id: req.hospitalId } });
      res.json({ success: true, data: updatedTest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteRadiologyTest(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { rad_test_id: req.params.id, hospital_id }
        : { rad_test_id: req.params.id };
      const deleted = await RadiologyTests.destroy({ where });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Radiology test not found' });
      }
      res.json({ success: true, message: 'Radiology test deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RadiologyTestsController;
