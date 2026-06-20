const { Bed, Hospital, Ward } = require('../models');

class BedController {
  static async createBed(req, res) {
    try {
      const { ward_id, room_number, bed_number, bed_type, status, charge_per_day, hospital_id } = req.body;
      
      if (!ward_id || !bed_number || !bed_type || !charge_per_day || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'ward_id, bed_number, bed_type, charge_per_day, and hospital_id are required' 
        });
      }

      const bed = await Bed.create({ 
        ward_id, 
        room_number, 
        bed_number, 
        bed_type, 
        status: status || 'Available',
        charge_per_day, 
        hospital_id 
      });
      
      const hospital = await Hospital.findByPk(hospital_id);
      const ward = await Ward.findByPk(ward_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Bed created successfully',
        data: {
          ...bed.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllBeds(req, res) {
    try {
      // Honour optional filters so callers like `GET /beds?status=Available&ward_id=3`
      // get the subset they ask for. Absent params keep the previous "all active
      // beds" behaviour, so existing callers (which filter client-side) still work.
      const where = {
        is_active: true,
        hospital_id: req.hospitalId
      };
      if (req.query.status) where.status = req.query.status;
      if (req.query.ward_id) where.ward_id = req.query.ward_id;

      const beds = await Bed.findAll({ where });

      // Batch-load hospital + wards once instead of one query per bed (no N+1).
      const hospital = await Hospital.findByPk(req.hospitalId);
      const hospitalLite = hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null;
      const wardIds = [...new Set(beds.map(b => b.ward_id).filter(Boolean))];
      const wards = wardIds.length ? await Ward.findAll({ where: { ward_id: wardIds } }) : [];
      const wardById = {};
      wards.forEach(w => { wardById[w.ward_id] = w; });

      const bedsWithDetails = beds.map((bed) => {
        const ward = wardById[bed.ward_id];
        return {
          ...bed.toJSON(),
          hospital: hospitalLite,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null
        };
      });

      res.json({ success: true, data: bedsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getBedById(req, res) {
    try {
      const bed = await Bed.findOne({
        where: {
          bed_id: req.params.id,
          hospital_id: req.hospitalId
        }
      });
      if (!bed) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }
      
      const hospital = await Hospital.findByPk(bed.hospital_id);
      const ward = await Ward.findByPk(bed.ward_id);
      
      res.json({ 
        success: true, 
        data: {
          ...bed.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateBed(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      const where = {
        bed_id: req.params.id,
        hospital_id: req.hospitalId
      };
      
      if (is_active === 0 || is_active === false) {
        const [updated] = await Bed.update(
          { is_active: false },
          { where }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Bed not found' });
        }
        const deactivatedBed = await Bed.findOne({ where });
        const hospital = await Hospital.findByPk(deactivatedBed.hospital_id);
        const ward = await Ward.findByPk(deactivatedBed.ward_id);
        return res.json({ 
          success: true, 
          message: 'Bed deactivated successfully', 
          data: {
            ...deactivatedBed.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null
          }
        });
      }
      
      const [updated] = await Bed.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }
      const updatedBed = await Bed.findOne({ where });
      const hospital = await Hospital.findByPk(updatedBed.hospital_id);
      const ward = await Ward.findByPk(updatedBed.ward_id);
      
      res.json({ 
        success: true, 
        data: {
          ...updatedBed.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          ward: ward ? { ward_id: ward.ward_id, ward_name: ward.ward_name, ward_type: ward.ward_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteBed(req, res) {
    try {
      // Soft-delete: a bed can be referenced by historical IPD admissions via FK,
      // so a hard DELETE would 500. Deactivating hides it from the active list
      // (getAllBeds filters is_active: true) while preserving referential integrity.
      const [updated] = await Bed.update(
        { is_active: false },
        { where: { bed_id: req.params.id, hospital_id: req.hospitalId } }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }
      res.json({ success: true, message: 'Bed deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = BedController;
