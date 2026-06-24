const { StockReturn, StockIssue, Department, User, Hospital, InventoryItem } = require('../models');

class StockReturnController {
  static async createStockReturn(req, res) {
    const transaction = await StockReturn.sequelize.transaction();
    try {
      const { return_date, department_id, item_id, quantity, reason, returned_by, hospital_id } = req.body;

      if (!return_date || !department_id || !item_id || !quantity || !returned_by || !hospital_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'return_date, department_id, item_id, quantity, returned_by, and hospital_id are required'
        });
      }

      const qty = Number(quantity);
      if (!(qty > 0)) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
      }

      // Lock the inventory item for an atomic stock update
      const item = await InventoryItem.findByPk(item_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!item) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      // Cap the return to what was actually issued (net of prior returns) to this
      // department, so stock can't be inflated by returning more than was taken.
      const issued = Number(await StockIssue.sum('quantity', { where: { item_id, department_id, hospital_id, is_active: true }, transaction })) || 0;
      const returnedSoFar = Number(await StockReturn.sum('quantity', { where: { item_id, department_id, hospital_id, is_active: true }, transaction })) || 0;
      const netIssued = issued - returnedSoFar;
      if (qty > netIssued) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Return quantity (${qty}) exceeds the net issued quantity (${netIssued}) for this item in the selected department.`
        });
      }

      // Increase inventory stock
      await item.update({
        current_stock: (Number(item.current_stock) || 0) + qty
      }, { transaction });

      const stockReturn = await StockReturn.create({
        return_date,
        department_id,
        item_id,
        quantity: qty,
        reason,
        returned_by,
        hospital_id
      }, { transaction });

      await transaction.commit();
      
      const department = await Department.findByPk(department_id);
      const user = await User.findByPk(returned_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(hospital_id);
      const updatedItem = await InventoryItem.findByPk(item_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Stock return created successfully',
        data: {
          ...stockReturn.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          returnedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          item: updatedItem ? { item_id: updatedItem.item_id, item_name: updatedItem.item_name, current_stock: updatedItem.current_stock } : null
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllStockReturns(req, res) {
    try {
      const stockReturns = await StockReturn.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });
      
      const returnsWithDetails = await Promise.all(
        stockReturns.map(async (returnItem) => {
          const department = await Department.findByPk(returnItem.department_id);
          const user = await User.findByPk(returnItem.returned_by, { attributes: { exclude: ['password'] } });
          const hospital = await Hospital.findByPk(returnItem.hospital_id);
          const item = await InventoryItem.findByPk(returnItem.item_id);
          return {
            ...returnItem.toJSON(),
            department: department ? { id: department.id, department_name: department.department_name } : null,
            returnedBy: user ? { id: user.id, username: user.name } : null,
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            item: item ? { item_id: item.item_id, item_name: item.item_name } : null
          };
        })
      );
      
      res.json({ success: true, data: returnsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStockReturnById(req, res) {
    try {
      const stockReturn = await StockReturn.findOne({ where: { return_id: req.params.id, hospital_id: req.hospitalId } });
      if (!stockReturn) {
        return res.status(404).json({ success: false, message: 'Stock return not found' });
      }
      
      const department = await Department.findByPk(stockReturn.department_id);
      const user = await User.findByPk(stockReturn.returned_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(stockReturn.hospital_id);
      const item = await InventoryItem.findByPk(stockReturn.item_id);
      
      res.json({ 
        success: true, 
        data: {
          ...stockReturn.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          returnedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          item: item ? { item_id: item.item_id, item_name: item.item_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStockReturn(req, res) {
    try {
      const { is_active, ...updateData } = req.body;
      
      if (is_active === 0 || is_active === false) {
        const [updated] = await StockReturn.update(
          { is_active: false },
          { where: { return_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Stock return not found' });
        }
        const deactivatedReturn = await StockReturn.findOne({ where: { return_id: req.params.id, hospital_id: req.hospitalId } });
        return res.json({ 
          success: true, 
          message: 'Stock return deactivated successfully', 
          data: deactivatedReturn
        });
      }
      
      const [updated] = await StockReturn.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { return_id: req.params.id, hospital_id: req.hospitalId } }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Stock return not found' });
      }
      const updatedReturn = await StockReturn.findOne({ where: { return_id: req.params.id, hospital_id: req.hospitalId } });
      const department = await Department.findByPk(updatedReturn.department_id);
      const user = await User.findByPk(updatedReturn.returned_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(updatedReturn.hospital_id);
      const item = await InventoryItem.findByPk(updatedReturn.item_id);
      
      res.json({ 
        success: true, 
        data: {
          ...updatedReturn.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          returnedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          item: item ? { item_id: item.item_id, item_name: item.item_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteStockReturn(req, res) {
    try {
      const deleted = await StockReturn.destroy({
        where: { return_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Stock return not found' });
      }
      res.json({ success: true, message: 'Stock return permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = StockReturnController;
