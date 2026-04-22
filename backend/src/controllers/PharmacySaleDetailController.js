const { PharmacySaleDetail, PharmacySale, Medicine, MedicineBatch, Hospital } = require('../models');

class PharmacySaleDetailController {
  static async createSaleDetail(req, res) {
    const transaction = await PharmacySaleDetail.sequelize.transaction();
    try {
      const { sale_id, medicine_id, batch_id, medicine_name, quantity, rate, gst_percentage, hospital_id } = req.body;
      
      if (!sale_id || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'sale_id and hospital_id are required' 
        });
      }

      // Check batch availability
      if (batch_id) {
        const batch = await MedicineBatch.findByPk(batch_id);
        if (!batch) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        if (batch.available_quantity < quantity) {
          await transaction.rollback();
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient stock. Available: ${batch.available_quantity}` 
          });
        }

        // Reduce batch quantity
        await batch.update({
          available_quantity: batch.available_quantity - quantity
        }, { transaction });
      }

      const calculatedAmount = quantity && rate ? quantity * rate : 0;

      const saleDetail = await PharmacySaleDetail.create({ 
        sale_id,
        medicine_id,
        batch_id,
        medicine_name,
        quantity,
        rate,
        amount: calculatedAmount,
        gst_percentage,
        hospital_id
      }, { transaction });

      await transaction.commit();

      const sale = await PharmacySale.findByPk(sale_id);
      const medicine = medicine_id ? await Medicine.findByPk(medicine_id) : null;
      const batch = batch_id ? await MedicineBatch.findByPk(batch_id) : null;
      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Sale detail created successfully',
        data: {
          ...saleDetail.toJSON(),
          sale: sale ? { sale_id: sale.sale_id, sale_date: sale.sale_date, net_amount: sale.net_amount } : null,
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
          batch: batch ? { batch_id: batch.batch_id, batch_number: batch.batch_number, expiry_date: batch.expiry_date } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllSaleDetails(req, res) {
    try {
      const { sale_id, medicine_id, batch_id } = req.query;
      const where = { is_active: true };
      
      if (sale_id) where.sale_id = sale_id;
      if (medicine_id) where.medicine_id = medicine_id;
      if (batch_id) where.batch_id = batch_id;

      const saleDetails = await PharmacySaleDetail.findAll({ where });

      const saleDetailsWithDetails = await Promise.all(
        saleDetails.map(async (saleDetail) => {
          const sale = await PharmacySale.findByPk(saleDetail.sale_id);
          const medicine = saleDetail.medicine_id ? await Medicine.findByPk(saleDetail.medicine_id) : null;
          const batch = saleDetail.batch_id ? await MedicineBatch.findByPk(saleDetail.batch_id) : null;
          const hospital = await Hospital.findByPk(saleDetail.hospital_id);
          
          return {
            ...saleDetail.toJSON(),
            sale: sale ? { sale_id: sale.sale_id, sale_date: sale.sale_date, net_amount: sale.net_amount } : null,
            medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
            batch: batch ? { batch_id: batch.batch_id, batch_number: batch.batch_number, expiry_date: batch.expiry_date } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: saleDetailsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSaleDetailById(req, res) {
    try {
      const saleDetail = await PharmacySaleDetail.findOne({ where: { detail_id: req.params.id, hospital_id: req.hospitalId } });
      
      if (!saleDetail) {
        return res.status(404).json({ success: false, message: 'Sale detail not found' });
      }

      const sale = await PharmacySale.findByPk(saleDetail.sale_id);
      const medicine = saleDetail.medicine_id ? await Medicine.findByPk(saleDetail.medicine_id) : null;
      const batch = saleDetail.batch_id ? await MedicineBatch.findByPk(saleDetail.batch_id) : null;
      const hospital = await Hospital.findByPk(saleDetail.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...saleDetail.toJSON(),
          sale: sale ? { sale_id: sale.sale_id, sale_date: sale.sale_date, net_amount: sale.net_amount } : null,
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
          batch: batch ? { batch_id: batch.batch_id, batch_number: batch.batch_number, expiry_date: batch.expiry_date } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateSaleDetail(req, res) {
    try {
      const { is_active, quantity, rate, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await PharmacySaleDetail.update(
          { is_active: false },
          { where: { sale_detail_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Sale detail not found' });
        }
        const deactivatedSaleDetail = await PharmacySaleDetail.findOne({ where: { detail_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ success: true, message: 'Sale detail deactivated successfully', data: deactivatedSaleDetail });
      }

      const existingSaleDetail = await PharmacySaleDetail.findOne({ where: { detail_id: req.params.id, hospital_id: req.hospitalId } });
      if (!existingSaleDetail) {
        return res.status(404).json({ success: false, message: 'Sale detail not found' });
      }

      const finalQuantity = quantity !== undefined ? quantity : existingSaleDetail.quantity;
      const finalRate = rate !== undefined ? rate : existingSaleDetail.rate;
      const calculatedAmount = finalQuantity && finalRate ? finalQuantity * finalRate : 0;

      const [updated] = await PharmacySaleDetail.update(
        { 
          ...updateData, 
          quantity: finalQuantity,
          rate: finalRate,
          amount: calculatedAmount,
          is_active: is_active !== undefined ? is_active : true 
        },
        { where: { sale_detail_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Sale detail not found' });
      }

      const updatedSaleDetail = await PharmacySaleDetail.findOne({ where: { detail_id: req.params.id, hospital_id: req.hospitalId } });
      const sale = await PharmacySale.findByPk(updatedSaleDetail.sale_id);
      const medicine = updatedSaleDetail.medicine_id ? await Medicine.findByPk(updatedSaleDetail.medicine_id) : null;
      const batch = updatedSaleDetail.batch_id ? await MedicineBatch.findByPk(updatedSaleDetail.batch_id) : null;
      const hospital = await Hospital.findByPk(updatedSaleDetail.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedSaleDetail.toJSON(),
          sale: sale ? { sale_id: sale.sale_id, sale_date: sale.sale_date, net_amount: sale.net_amount } : null,
          medicine: medicine ? { medicine_id: medicine.medicine_id, medicine_name: medicine.medicine_name, medicine_code: medicine.medicine_code } : null,
          batch: batch ? { batch_id: batch.batch_id, batch_number: batch.batch_number, expiry_date: batch.expiry_date } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteSaleDetail(req, res) {
    try {
      const deleted = await PharmacySaleDetail.destroy({
        where: { sale_detail_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Sale detail not found' });
      }

      res.json({ success: true, message: 'Sale detail permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = PharmacySaleDetailController;
