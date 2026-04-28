const { Package, Hospital, BillingEpisode, BillCharge, sequelize } = require('../models');

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

  // POST /api/packages/:id/apply  body: { episode_id, discount_percent? }
  // Posts the package's total_charge as a single BillCharge on the open billing episode.
  // Idempotent per (episode_id, package_id): blocks duplicate application of the same package.
  static async applyToEpisode(req, res) {
    const t = await sequelize.transaction();
    try {
      const package_id = parseInt(req.params.id, 10);
      const { episode_id, discount_percent = 0 } = req.body;
      const hospital_id = req.user?.hospital_id;

      if (!episode_id || !package_id || !hospital_id) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'package id, episode_id, and hospital_id are required' });
      }

      const pkg = await Package.findOne({
        where: { package_id, hospital_id, is_active: true },
        transaction: t
      });
      if (!pkg) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Package not found or inactive' });
      }

      const episode = await BillingEpisode.findOne({
        where: { episode_id, hospital_id, status: 'Open' },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!episode) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Open billing episode not found' });
      }

      // Block duplicate application — same package on same episode.
      const existing = await BillCharge.findOne({
        where: { episode_id, service_type: 'Package', service_id: package_id, is_active: true },
        transaction: t
      });
      if (existing) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          message: `Package "${pkg.package_name}" is already applied to this episode`,
          existing_charge_id: existing.charge_id
        });
      }

      const rate = parseFloat(pkg.total_charge);
      const discPct = Math.max(0, Math.min(100, parseFloat(discount_percent) || 0));
      const discountAmount = +(rate * discPct / 100).toFixed(2);
      const taxableAmount = +(rate - discountAmount).toFixed(2);
      // Healthcare service packages are GST-exempt under India's clinical-establishment exemption.
      const gstPct = 0;
      const gstAmount = 0;
      const netAmount = taxableAmount;

      const charge = await BillCharge.create({
        episode_id,
        hospital_id,
        charge_date: new Date(),
        service_type: 'Package',
        service_id: package_id,
        description: `Package - ${pkg.package_name} (${pkg.package_type})`,
        quantity: 1,
        rate,
        amount: rate,
        discount_percent: discPct,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        gst_percent: gstPct,
        gst_amount: gstAmount,
        net_amount: netAmount
      }, { transaction: t });

      await t.commit();

      res.status(201).json({
        success: true,
        message: 'Package applied to episode',
        data: {
          charge,
          package: { package_id: pkg.package_id, package_name: pkg.package_name, package_type: pkg.package_type, services_included: pkg.services_included }
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PackageController;
