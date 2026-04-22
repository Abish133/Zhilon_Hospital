const { LabTest, Hospital } = require('../models');

class LabTestController {
  static async createLabTest(req, res) {
    try {
      const { test_code, test_name, test_category, department, sample_type, sample_volume, container_type, normal_range, turn_around_time_hours, charge, hospital_id } = req.body;
      
      if (!test_name || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'test_name and hospital_id are required' 
        });
      }

      const labTest = await LabTest.create({ 
        test_code,
        test_name,
        test_category,
        department,
        sample_type,
        sample_volume,
        container_type,
        normal_range,
        turn_around_time_hours,
        charge,
        hospital_id
      });

      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Lab test created successfully',
        data: {
          ...labTest.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllLabTests(req, res) {
    try {
      const { test_category, department, sample_type } = req.query;
      const where = { 
        is_active: true,
        hospital_id: req.hospitalId
      };
      
      if (test_category) where.test_category = test_category;
      if (department) where.department = department;
      if (sample_type) where.sample_type = sample_type;

      const labTests = await LabTest.findAll({ where });

      const labTestsWithDetails = await Promise.all(
        labTests.map(async (labTest) => {
          const hospital = await Hospital.findByPk(labTest.hospital_id);
          
          return {
            ...labTest.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: labTestsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLabTestById(req, res) {
    try {
      const labTest = await LabTest.findOne({ where: { test_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!labTest) {
        return res.status(404).json({ success: false, message: 'Lab test not found' });
      }

      const hospital = await Hospital.findByPk(labTest.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...labTest.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateLabTest(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await LabTest.update(
          { is_active: false },
          { where: { test_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Lab test not found' });
        }
        const deactivatedLabTest = await LabTest.findOne({ where: { test_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Lab test deactivated successfully', data: deactivatedLabTest });
      }

      const [updated] = await LabTest.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { test_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Lab test not found' });
      }

      const updatedLabTest = await LabTest.findOne({ where: { test_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedLabTest.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedLabTest.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteLabTest(req, res) {
    try {
      const deleted = await LabTest.destroy({
        where: { test_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Lab test not found' });
      }

      res.json({ success: true, message: 'Lab test permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = LabTestController;
