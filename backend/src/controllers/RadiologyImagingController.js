const { RadiologyImaging, RadiologyOrders, Employee } = require('../models');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/radiology');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed'));
    }
  }
});

class RadiologyImagingController{
  static async uploadImage(req, res) {
    try {
      const { radiology_order_id, technologist_id } = req.body;

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      if (!radiology_order_id) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({
          success: false,
          message: 'radiology_order_id is required'
        });
      }

      const hospital_id = req.user?.hospital_id;
      const order = await RadiologyOrders.findByPk(radiology_order_id);
      if (!order || (hospital_id && order.hospital_id !== hospital_id)) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({
          success: false,
          message: 'Radiology order not found'
        });
      }

      const imagingRecord = await RadiologyImaging.create({
        rad_order_id: radiology_order_id,
        images_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        technologist_id: technologist_id || null,
        upload_date: new Date(),
        is_active: true,
        hospital_id
      });

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: imagingRecord
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  static async createRadiologyImaging(req, res) {
    try {
      if (!req.body.rad_order_id) {
        return res.status(400).json({
          success: false,
          message: 'Radiology order ID is required'
        });
      }

      const hospital_id = req.user?.hospital_id;
      const radiologyImaging = await RadiologyImaging.create({ ...req.body, hospital_id });
      const radiologyOrder = await RadiologyOrders.findByPk(req.body.rad_order_id);
      const technologist = req.body.technologist_id ? await Employee.findByPk(req.body.technologist_id) : null;
     
      res.status(201).json({
        success: true,
        data: {
          ...radiologyImaging.toJSON(),
          radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
          technologist: technologist ? { id: technologist.id, name: technologist.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllRadiologyImaging(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const { rad_order_id } = req.query;
      const whereClause = {};
      if (rad_order_id) whereClause.rad_order_id = rad_order_id;
      if (hospital_id) whereClause.hospital_id = hospital_id;

      const radiologyImaging = await RadiologyImaging.findAll({ where: whereClause });
     
      const imagingWithDetails = await Promise.all(
        radiologyImaging.map(async (imaging) => {
          const radiologyOrder = await RadiologyOrders.findByPk(imaging.rad_order_id);
          const technologist = await Employee.findByPk(imaging.technologist_id);
          
          // Convert BLOB to base64 string
          const imagingData = imaging.toJSON();
          if (imagingData.images_path && Buffer.isBuffer(imagingData.images_path)) {
            imagingData.images_path = imagingData.images_path.toString('utf-8');
          }
          
          return {
            ...imagingData,
            radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
            technologist: technologist ? { employee_id: technologist.employee_id, full_name: technologist.full_name } : null
          };
        })
      );
     
      res.json({ success: true, data: imagingWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRadiologyImagingById(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const radiologyImaging = await RadiologyImaging.findOne({ where: { imaging_id: req.params.id, hospital_id: req.hospitalId } });
      if (!radiologyImaging || (hospital_id && radiologyImaging.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'Radiology imaging record not found' });
      }
     
      const radiologyOrder = await RadiologyOrders.findByPk(radiologyImaging.rad_order_id);
      const technologist = await Employee.findByPk(radiologyImaging.technologist_id);
      
      // Convert BLOB to base64 string
      const imagingData = radiologyImaging.toJSON();
      if (imagingData.images_path && Buffer.isBuffer(imagingData.images_path)) {
        imagingData.images_path = imagingData.images_path.toString('utf-8');
      }
     
      res.json({
        success: true,
        data: {
          ...imagingData,
          radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
          technologist: technologist ? { employee_id: technologist.employee_id, full_name: technologist.full_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateRadiologyImaging(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const where = hospital_id
        ? { imaging_id: req.params.id, hospital_id }
        : { imaging_id: req.params.id };
      const [updated] = await RadiologyImaging.update(req.body, { where });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Radiology imaging record not found' });
      }
      const updatedImaging = await RadiologyImaging.findOne({ where: { imaging_id: req.params.id, hospital_id: req.hospitalId } });
      const radiologyOrder = await RadiologyOrders.findByPk(updatedImaging.rad_order_id);
      const technologist = await Employee.findByPk(updatedImaging.technologist_id);
     
      res.json({
        success: true,
        data: {
          ...updatedImaging.toJSON(),
          radiologyOrder: radiologyOrder ? { rad_order_id: radiologyOrder.rad_order_id, test_name: radiologyOrder.test_name } : null,
          technologist: technologist ? { id: technologist.id, name: technologist.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteRadiologyImaging(req, res) {
    try {
      const hospital_id = req.user?.hospital_id;
      const imaging = await RadiologyImaging.findOne({ where: { imaging_id: req.params.id, hospital_id: req.hospitalId } });
      if (!imaging || (hospital_id && imaging.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'Radiology imaging record not found' });
      }

      // Delete file from disk if it exists
      if (imaging.images_path) {
        try {
          await fs.unlink(imaging.images_path);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      await imaging.update({ is_active: false });
      res.json({ success: true, message: 'Radiology imaging record deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async downloadImage(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const imaging = await RadiologyImaging.findByPk(id);
      if (!imaging || (hospital_id && imaging.hospital_id !== hospital_id)) {
        return res.status(404).json({ success: false, message: 'Image not found' });
      }

      if (!imaging.images_path) {
        return res.status(404).json({ success: false, message: 'Image file not found' });
      }

      // Check if file exists
      try {
        await fs.access(imaging.images_path);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Image file not found on server'
        });
      }

      res.download(imaging.images_path, imaging.file_name || 'radiology_image', (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = { RadiologyImagingController, upload };