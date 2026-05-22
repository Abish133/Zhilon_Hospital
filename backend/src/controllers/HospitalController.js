const { Hospital } = require('../models');

class HospitalController {
  static async registerHospital(req, res) {
    try {
      const { hospitalName, licenseNumber, address, phone, hospitalEmail, hospitalType } = req.body;
      
      if (!hospitalName || !licenseNumber || !address || !phone || !hospitalEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required' 
        });
      }

      const hospital = await Hospital.create({ 
        hospitalName, 
        licenseNumber, 
        address, 
        phone, 
        hospitalEmail, 
        hospitalType: hospitalType || 'general'
      });

      res.status(201).json({ 
        success: true, 
        message: 'Hospital registered successfully',
        data: hospital
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Hospital with this email or license number already exists' 
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllHospitals(req, res) {
    try {
      // Only return the user's hospital (hospital scoping)
      const where = { isActive: true };
      if (req.hospitalId) {
        where.id = req.hospitalId;
      }
      const hospitals = await Hospital.findAll({ where });
      res.json({ success: true, data: hospitals });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getHospitalById(req, res) {
    try {
      // Ensure user can only access their own hospital
      const where = { id: req.params.id };
      if (req.hospitalId && req.params.id != req.hospitalId) {
        return res.status(403).json({ success: false, message: 'Access denied to this hospital' });
      }
      const hospital = await Hospital.findOne({ where });
      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }
      res.json({ success: true, data: hospital });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateHospital(req, res) {
    try {
      // Ensure user can only update their own hospital
      if (req.hospitalId && req.params.id != req.hospitalId) {
        return res.status(403).json({ success: false, message: 'Access denied to update this hospital' });
      }
      
      const { isActive, ...updateData } = req.body;
      const where = { id: req.params.id };
      
      if (isActive === 0 || isActive === false) {
        const [updated] = await Hospital.update(
          { isActive: false },
          { where }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Hospital not found' });
        }
        const deactivatedHospital = await Hospital.findOne({ where });
        return res.json({ success: true, message: 'Hospital deactivated successfully', data: deactivatedHospital });
      }
      
      const [updated] = await Hospital.update(
        { ...updateData, isActive: isActive !== undefined ? isActive : true },
        { where }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }
      const updatedHospital = await Hospital.findOne({ where });
      res.json({ success: true, data: updatedHospital });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async uploadLogo(req, res) {
    try {
      // Ensure user can only update their own hospital's logo
      if (req.hospitalId && req.params.id != req.hospitalId) {
        return res.status(403).json({ success: false, message: 'Access denied to update this hospital' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No logo file uploaded' });
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;
      const [updated] = await Hospital.update({ logo_url: logoUrl }, { where: { id: req.params.id } });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }

      const hospital = await Hospital.findOne({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Logo uploaded successfully', data: { logo_url: logoUrl, hospital } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteHospital(req, res) {
    try {
      // Ensure user can only delete their own hospital
      if (req.hospitalId && req.params.id != req.hospitalId) {
        return res.status(403).json({ success: false, message: 'Access denied to delete this hospital' });
      }
      
      const deleted = await Hospital.destroy({
        where: { id: req.params.id }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }
      res.json({ success: true, message: 'Hospital permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = HospitalController;