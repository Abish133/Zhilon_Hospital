const { Op } = require('sequelize');
const {
  Package, Hospital, BillingEpisode, BillCharge,
  LabOrder, LabOrderDetail, LabTest,
  RadiologyOrders, RadiologyTests,
  PackageApplication,
  IpdAdmission, OpdVisit,
  sequelize
} = require('../models');

// Resolves a package's `services_included` JSON into a normalised structure
// regardless of whether it uses the new format or legacy slug format.
//
// New format (preferred): { lab_tests:[ids], radiology_tests:[ids], consult_credits:N }
// Legacy slug format:     { cbc:1, lipid:1, ecg:1, consult:2 }
//
// Returns: { lab: [{ test_id, name }], radiology: [{ test_id, name }], consult_credits: number, unresolved: [string] }
async function resolveServicesIncluded(servicesIncluded, hospital_id, transaction) {
  const out = { lab: [], radiology: [], consult_credits: 0, unresolved: [] };
  if (!servicesIncluded) return out;

  // ------- New structured format -------
  if (servicesIncluded.lab_tests || servicesIncluded.radiology_tests || servicesIncluded.consult_credits != null) {
    const labIds = Array.isArray(servicesIncluded.lab_tests) ? servicesIncluded.lab_tests : [];
    const radIds = Array.isArray(servicesIncluded.radiology_tests) ? servicesIncluded.radiology_tests : [];
    if (labIds.length) {
      const tests = await LabTest.findAll({
        where: { test_id: { [Op.in]: labIds }, hospital_id, is_active: true },
        transaction
      });
      out.lab = tests.map(t => ({ test_id: t.test_id, name: t.test_name, sample_type: t.sample_type, charge: t.charge }));
    }
    if (radIds.length) {
      const tests = await RadiologyTests.findAll({
        where: { rad_test_id: { [Op.in]: radIds }, hospital_id, is_active: true },
        transaction
      });
      out.radiology = tests.map(t => ({ test_id: t.rad_test_id, name: t.test_name, modality: t.modality, charge: t.charge }));
    }
    out.consult_credits = parseInt(servicesIncluded.consult_credits || 0, 10) || 0;
    return out;
  }

  // ------- Legacy slug format -------
  // Iterate keys, try to resolve each against LabTest.test_code (case-insensitive),
  // then against RadiologyTests.test_code, then against LabTest.test_name.
  // 'consult' / 'consultation' is treated as consultation credits.
  const slugs = Object.keys(servicesIncluded);
  for (const slug of slugs) {
    const qty = parseInt(servicesIncluded[slug] || 1, 10) || 1;
    const lower = String(slug).toLowerCase();

    if (lower === 'consult' || lower === 'consultation') {
      out.consult_credits += qty;
      continue;
    }

    let resolved = false;

    // Try LabTest by code
    const labByCode = await LabTest.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('test_code')),
        lower
      ),
      transaction
    });
    if (labByCode && labByCode.hospital_id === hospital_id) {
      for (let i = 0; i < qty; i++) {
        out.lab.push({ test_id: labByCode.test_id, name: labByCode.test_name, sample_type: labByCode.sample_type, charge: labByCode.charge });
      }
      resolved = true;
      continue;
    }

    // Try RadiologyTests by code
    const radByCode = await RadiologyTests.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('test_code')),
        lower
      ),
      transaction
    });
    if (radByCode && radByCode.hospital_id === hospital_id) {
      for (let i = 0; i < qty; i++) {
        out.radiology.push({ test_id: radByCode.rad_test_id, name: radByCode.test_name, modality: radByCode.modality, charge: radByCode.charge });
      }
      resolved = true;
      continue;
    }

    // Try LabTest by name (looser match — handles seed slugs like 'cbc')
    const labByName = await LabTest.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('test_name')),
        { [Op.like]: `%${lower}%` }
      ),
      transaction
    });
    if (labByName && labByName.hospital_id === hospital_id) {
      for (let i = 0; i < qty; i++) {
        out.lab.push({ test_id: labByName.test_id, name: labByName.test_name, sample_type: labByName.sample_type, charge: labByName.charge });
      }
      resolved = true;
      continue;
    }

    if (!resolved) out.unresolved.push(`${slug}x${qty}`);
  }
  return out;
}

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
  //
  // Atomically:
  //   1. Posts the package as a single BillCharge on the open episode.
  //   2. Auto-creates the included Lab orders + Radiology orders, each tagged with
  //      covered_by_package_charge_id so their controllers SKIP their own auto-bill.
  //   3. Records consultation credits in package_applications so future consultations
  //      on this episode can be drawn against the package without re-billing.
  //
  // Idempotent: blocks re-applying the same package to the same episode.
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

      // Block duplicate application
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
      const netAmount = taxableAmount;

      // 1) Single bundled BillCharge for the whole package
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
        gst_percent: 0,
        gst_amount: 0,
        net_amount: netAmount
      }, { transaction: t });

      // 2) Resolve services_included → real lab + radiology tests + consult credits
      const resolved = await resolveServicesIncluded(pkg.services_included, hospital_id, t);

      // 3) Create lab order (with details) for included lab tests, marked covered.
      //    LabOrder requires patient_id, visit_id, visit_type — derive from episode.
      let labOrderId = null;
      if (resolved.lab.length > 0) {
        const visitType = episode.episode_type; // 'OPD' | 'IPD'
        const visitId = episode.episode_type === 'OPD' ? episode.opd_visit_id : episode.admission_id;
        if (visitId) {
          // Resolve ordering doctor from the OPD visit / IPD admission.
          let orderingDoctorId = null;
          if (visitType === 'OPD' && visitId) {
            const v = await OpdVisit.findByPk(visitId, { transaction: t });
            orderingDoctorId = v?.doctor_id || null;
          } else if (visitType === 'IPD' && visitId) {
            const a = await IpdAdmission.findByPk(visitId, { transaction: t });
            orderingDoctorId = a?.admitting_doctor_id || null;
          }

          const labOrder = await LabOrder.create({
            patient_id: episode.patient_id,
            uhid: episode.uhid,
            visit_type: visitType,
            visit_id: visitId,
            ordered_by: orderingDoctorId,
            order_date: new Date(),
            status: 'Ordered',
            hospital_id
          }, { transaction: t });
          labOrderId = labOrder.order_id;

          for (const lt of resolved.lab) {
            await LabOrderDetail.create({
              order_id: labOrder.order_id,
              test_id: lt.test_id,
              test_name: lt.name,
              sample_type: lt.sample_type || null,
              status: 'Pending',
              charge: lt.charge || 0,
              covered_by_package_charge_id: charge.charge_id, // ← suppresses auto-bill
              hospital_id
            }, { transaction: t });
          }
        }
      }

      // 4) Create radiology orders for included imaging, marked covered.
      const radOrderIds = [];
      if (resolved.radiology.length > 0) {
        const visitType = episode.episode_type;
        const visitId = episode.episode_type === 'OPD' ? episode.opd_visit_id : episode.admission_id;
        if (visitId) {
          let orderingDoctorId = null;
          if (visitType === 'OPD') {
            const v = await OpdVisit.findByPk(visitId, { transaction: t });
            orderingDoctorId = v?.doctor_id || null;
          } else if (visitType === 'IPD') {
            const a = await IpdAdmission.findByPk(visitId, { transaction: t });
            orderingDoctorId = a?.admitting_doctor_id || null;
          }

          if (orderingDoctorId) {
            for (const rt of resolved.radiology) {
              const r = await RadiologyOrders.create({
                patient_id: episode.patient_id,
                uhid: episode.uhid,
                visit_type: visitType,
                visit_id: visitId,
                rad_test_id: rt.test_id,
                test_name: rt.name,
                modality: rt.modality || 'X-Ray',
                ordered_by: orderingDoctorId,
                order_date: new Date(),
                status: 'Ordered',
                covered_by_package_charge_id: charge.charge_id, // ← suppresses auto-bill
                hospital_id
              }, { transaction: t });
              radOrderIds.push(r.rad_order_id);
            }
          }
        }
      }

      // 5) Record the application + consultation credits
      const application = await PackageApplication.create({
        hospital_id,
        episode_id,
        package_id,
        bill_charge_id: charge.charge_id,
        consult_credits_total: resolved.consult_credits || 0,
        consult_credits_used: 0,
        applied_by: req.user?.id || null,
        applied_at: new Date()
      }, { transaction: t });

      await t.commit();

      res.status(201).json({
        success: true,
        message: 'Package applied — bundled charge posted, included orders created automatically',
        data: {
          charge,
          application,
          package: {
            package_id: pkg.package_id,
            package_name: pkg.package_name,
            package_type: pkg.package_type
          },
          auto_created: {
            lab_order_id: labOrderId,
            lab_test_count: resolved.lab.length,
            radiology_order_ids: radOrderIds,
            radiology_test_count: resolved.radiology.length,
            consult_credits: resolved.consult_credits || 0,
            unresolved: resolved.unresolved
          }
        }
      });
    } catch (error) {
      try { await t.rollback(); } catch (_) { /* already rolled back */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PackageController;
