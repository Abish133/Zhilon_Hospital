const { StockIssue, Department, User, Hospital, InventoryItem } = require('../models');

class StockIssueController {
  static async createStockIssue(req, res) {
    const transaction = await StockIssue.sequelize.transaction();
    try {
      const { issue_date, department_id, item_id, quantity, purpose, issued_by, hospital_id } = req.body;
      
      if (!issue_date || !department_id || !item_id || !quantity || !issued_by || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'issue_date, department_id, item_id, quantity, issued_by, and hospital_id are required' 
        });
      }

      if (Number(quantity) <= 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
      }

      // Check inventory availability with lock
      const item = await InventoryItem.findByPk(item_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!item) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }
      if (item.current_stock < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${item.current_stock}`
        });
      }

      await item.update({
        current_stock: item.current_stock - quantity
      }, { transaction });

      const stockIssue = await StockIssue.create({ 
        issue_date, 
        department_id, 
        item_id, 
        quantity, 
        purpose, 
        issued_by, 
        hospital_id 
      }, { transaction });

      await transaction.commit();
      
      const department = await Department.findByPk(department_id);
      const user = await User.findByPk(issued_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(hospital_id);
      const updatedItem = await InventoryItem.findByPk(item_id);
      
      res.status(201).json({ 
        success: true, 
        message: 'Stock issue created successfully',
        data: {
          ...stockIssue.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          issuedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          item: updatedItem ? { item_id: updatedItem.item_id, item_name: updatedItem.item_name, current_stock: updatedItem.current_stock } : null
        }
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllStockIssues(req, res) {
    try {
      const where = { is_active: true };
      if (req.query.hospital_id) where.hospital_id = req.query.hospital_id;

      const stockIssues = await StockIssue.findAll({ where, order: [['issue_date', 'DESC']] });

      // Batch lookups (avoid N+1)
      const deptIds = [...new Set(stockIssues.map(i => i.department_id).filter(Boolean))];
      const userIds = [...new Set(stockIssues.map(i => i.issued_by).filter(Boolean))];
      const hospIds = [...new Set(stockIssues.map(i => i.hospital_id).filter(Boolean))];
      const itemIds = [...new Set(stockIssues.map(i => i.item_id).filter(Boolean))];

      const [departments, users, hospitals, items] = await Promise.all([
        deptIds.length ? Department.findAll({ where: { id: deptIds } }) : [],
        userIds.length ? User.findAll({ where: { id: userIds }, attributes: { exclude: ['password'] } }) : [],
        hospIds.length ? Hospital.findAll({ where: { id: hospIds } }) : [],
        itemIds.length ? InventoryItem.findAll({ where: { item_id: itemIds } }) : []
      ]);

      const dMap = Object.fromEntries(departments.map(d => [d.id, d]));
      const uMap = Object.fromEntries(users.map(u => [u.id, u]));
      const hMap = Object.fromEntries(hospitals.map(h => [h.id, h]));
      const iMap = Object.fromEntries(items.map(i => [i.item_id, i]));

      const issuesWithDetails = stockIssues.map(issue => {
        const d = dMap[issue.department_id];
        const u = uMap[issue.issued_by];
        const h = hMap[issue.hospital_id];
        const i = iMap[issue.item_id];
        return {
          ...issue.toJSON(),
          department: d ? { id: d.id, department_name: d.department_name } : null,
          issuedBy: u ? { id: u.id, name: u.name } : null,
          hospital: h ? { id: h.id, hospitalName: h.hospitalName } : null,
          item: i ? { item_id: i.item_id, item_name: i.item_name } : null
        };
      });

      res.json({ success: true, data: issuesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStockIssueById(req, res) {
    try {
      const stockIssue = await StockIssue.findOne({ where: { issue_id: req.params.id, hospital_id: req.hospitalId } });
      if (!stockIssue) {
        return res.status(404).json({ success: false, message: 'Stock issue not found' });
      }
      
      const department = await Department.findByPk(stockIssue.department_id);
      const user = await User.findByPk(stockIssue.issued_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(stockIssue.hospital_id);
      const item = await InventoryItem.findByPk(stockIssue.item_id);
      
      res.json({ 
        success: true, 
        data: {
          ...stockIssue.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          issuedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          item: item ? { item_id: item.item_id, item_name: item.item_name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStockIssue(req, res) {
    const transaction = await StockIssue.sequelize.transaction();
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const issue = await StockIssue.findOne({
          where: { issue_id: req.params.id, hospital_id: req.hospitalId },
          transaction, lock: transaction.LOCK.UPDATE
        });
        if (!issue) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: 'Stock issue not found' });
        }
        if (issue.is_active) {
          // restore stock when cancelling an active issue
          const item = await InventoryItem.findByPk(issue.item_id, {
            transaction, lock: transaction.LOCK.UPDATE
          });
          if (item) {
            await item.update({
              current_stock: (item.current_stock || 0) + (issue.quantity || 0)
            }, { transaction });
          }
        }
        await issue.update({ is_active: false }, { transaction });
        await transaction.commit();
        return res.json({
          success: true,
          message: 'Stock issue cancelled and stock restored',
          data: issue
        });
      }
      
      const [updated] = await StockIssue.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { issue_id: req.params.id, hospital_id: req.hospitalId }, transaction }
      );
      if (!updated) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Stock issue not found' });
      }
      await transaction.commit();
      const updatedIssue = await StockIssue.findOne({ where: { issue_id: req.params.id, hospital_id: req.hospitalId } });
      const department = await Department.findByPk(updatedIssue.department_id);
      const user = await User.findByPk(updatedIssue.issued_by, { attributes: { exclude: ['password'] } });
      const hospital = await Hospital.findByPk(updatedIssue.hospital_id);
      const item = await InventoryItem.findByPk(updatedIssue.item_id);

      res.json({
        success: true,
        data: {
          ...updatedIssue.toJSON(),
          department: department ? { id: department.id, department_name: department.department_name } : null,
          issuedBy: user ? { id: user.id, username: user.name } : null,
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          item: item ? { item_id: item.item_id, item_name: item.item_name } : null
        }
      });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteStockIssue(req, res) {
    const transaction = await StockIssue.sequelize.transaction();
    try {
      const issue = await StockIssue.findOne({
        where: { issue_id: req.params.id, hospital_id: req.hospitalId },
        transaction, lock: transaction.LOCK.UPDATE
      });
      if (!issue) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Stock issue not found' });
      }
      if (issue.is_active) {
        const item = await InventoryItem.findByPk(issue.item_id, {
          transaction, lock: transaction.LOCK.UPDATE
        });
        if (item) {
          await item.update({
            current_stock: (item.current_stock || 0) + (issue.quantity || 0)
          }, { transaction });
        }
      }
      await issue.destroy({ transaction });
      await transaction.commit();
      res.json({ success: true, message: 'Stock issue permanently deleted and stock restored' });
    } catch (error) {
      try { await transaction.rollback(); } catch (e) { /* ignore */ }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = StockIssueController;
