'use strict';
const { PatientDocument, Patient, User } = require('../models');
const fs = require('fs');
const path = require('path');

class PatientDocumentController {
  // Upload document
  static async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { patient_id, document_type, description } = req.body;
      const hospital_id = req.user?.hospital_id || req.body.hospital_id;

      if (!patient_id || !document_type) {
        return res.status(400).json({
          success: false,
          message: 'patient_id and document_type are required'
        });
      }

      // Verify patient exists
      const patient = await Patient.findByPk(patient_id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      const document = await PatientDocument.create({
        patient_id,
        document_type,
        filename: req.file.filename,
        original_filename: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        uploaded_by: req.user.id,
        hospital_id,
        description: description || null
      });

      const documentWithUser = await PatientDocument.findByPk(document.document_id, {
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: documentWithUser
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }

  // Get documents by patient
  static async getDocumentsByPatient(req, res) {
    try {
      const { patientId } = req.params;
      const { document_type } = req.query;
      const hospital_id = req.user?.hospital_id;

      // Check if patientId is a UHID (starts with letters) or numeric patient_id
      let patient_id = patientId;
      if (isNaN(patientId)) {
        // It's a UHID, look up the patient
        const patient = await Patient.findOne({
          where: { uhid: patientId },
          attributes: ['patient_id']
        });
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: 'Patient not found'
          });
        }
        patient_id = patient.patient_id;
      }

      const whereClause = {
        patient_id,
        is_active: true
      };

      if (document_type) {
        whereClause.document_type = document_type;
      }

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const documents = await PatientDocument.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  // Download document
  static async downloadDocument(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        document_id: id,
        is_active: true
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const document = await PatientDocument.findOne({ where: whereClause });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const filePath = path.join(__dirname, '../../', document.file_path);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      res.download(filePath, document.original_filename, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).json({
            success: false,
            message: 'Failed to download file'
          });
        }
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error.message
      });
    }
  }

  // Delete document
  static async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const hospital_id = req.user?.hospital_id;

      const whereClause = {
        document_id: id
      };

      if (hospital_id) {
        whereClause.hospital_id = hospital_id;
      }

      const document = await PatientDocument.findOne({ where: whereClause });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete file from disk
      const filePath = path.join(__dirname, '../../', document.file_path);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Soft delete from database
      await document.update({ is_active: false });

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }
}

module.exports = PatientDocumentController;

