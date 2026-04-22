const { Vendor, Hospital } = require('../models');

class VendorController {
  static async createVendor(req, res) {
    try {
      const { vendor_code, vendor_name, contact_person, mobile, email, address, gst_number, payment_terms, hospital_id } = req.body;
      
      if (!vendor_code || !vendor_name || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vendor code, vendor name, and hospital are required' 
        });
      }

      const vendor = await Vendor.create({ 
        vendor_code,
        vendor_name,
        contact_person,
        mobile,
        email,
        address,
        gst_number,
        payment_terms,
        hospital_id
      });

      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Vendor created successfully',
        data: {
          ...vendor.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Vendor code already exists' 
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllVendors(req, res) {
    try {
      const vendors = await Vendor.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });

      const vendorsWithDetails = await Promise.all(
        vendors.map(async (vendor) => {
          const hospital = await Hospital.findByPk(vendor.hospital_id);
          
          return {
            ...vendor.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: vendorsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getVendorById(req, res) {
    try {
      const vendor = await Vendor.findOne({ where: { vendor_id: req.params.id, hospital_id: req.hospitalId } });

      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }

      const hospital = await Hospital.findByPk(vendor.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...vendor.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateVendor(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await Vendor.update(
          { is_active: false },
          { where: { vendor_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        const deactivatedVendor = await Vendor.findOne({ where: { vendor_id: req.params.id, hospital_id: req.hospitalId } });
        const hospital = await Hospital.findByPk(deactivatedVendor.hospital_id);
        return res.json({ 
          success: true, 
          message: 'Vendor deactivated successfully', 
          data: {
            ...deactivatedVendor.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          }
        });
      }

      const [updated] = await Vendor.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { vendor_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }

      const updatedVendor = await Vendor.findOne({ where: { vendor_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedVendor.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedVendor.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteVendor(req, res) {
    try {
      const deleted = await Vendor.destroy({
        where: { vendor_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }

      res.json({ success: true, message: 'Vendor permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = VendorController;
