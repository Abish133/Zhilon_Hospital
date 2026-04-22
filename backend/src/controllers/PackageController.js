const { Package, Hospital } = require('../models');

class PackageController {
  static async create(req, res) {
    try {
      const { package_name, package_type, total_charge, hospital_id } = req.body;
      
      if (!package_name || !package_type || !total_charge || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'package_name, package_type, total_charge, and hospital_id are required' 
        });
      }

      const packageData = await Package.create(req.body);
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Package created successfully',
        data: {
          ...packageData.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { package_type } = req.query;
      const where = { 
        is_active: true,
        hospital_id: req.hospitalId
      };
      
      if (package_type) where.package_type = package_type;

      const packages = await Package.findAll({ 
        where,
        order: [['package_name', 'ASC']]
      });

      const packagesWithDetails = await Promise.all(
        packages.map(async (pkg) => {
          const hospital = await Hospital.findByPk(pkg.hospital_id);
          
          return {
            ...pkg.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: packagesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const packageData = await Package.findOne({ where: { package_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!packageData) {
        return res.status(404).json({ success: false, message: 'Package not found' });
      }

      const hospital = await Hospital.findByPk(packageData.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...packageData.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
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
        const [updated] = await Package.update(
          { is_active: false },
          { where: { package_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Package not found' });
        }
        const deactivatedPackage = await Package.findOne({ where: { package_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Package deactivated successfully', data: deactivatedPackage });
      }

      const [updated] = await Package.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { package_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Package not found' });
      }

      const updatedPackage = await Package.findOne({ where: { package_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedPackage.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedPackage.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await Package.destroy({
        where: { package_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Package not found' });
      }

      res.json({ success: true, message: 'Package permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PackageController;
