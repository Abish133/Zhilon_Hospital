const { InventoryItem, Hospital, InventoryCategory } = require('../models');

class InventoryItemController {
  static async createItem(req, res) {
    try {
      const { item_code, item_name, category_id, unit_of_measure, reorder_level, current_stock, rate_per_unit, hospital_id } = req.body;
      
      if (!item_code || !item_name || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Item code, item name, and hospital are required' 
        });
      }

      const item = await InventoryItem.create({ 
        item_code,
        item_name,
        category_id,
        unit_of_measure,
        reorder_level,
        current_stock: current_stock || 0,
        rate_per_unit,
        hospital_id
      });

      const hospital = await Hospital.findByPk(hospital_id);
      let category = null;
      if (category_id) {
        category = await InventoryCategory.findByPk(category_id);
      }

      res.status(201).json({ 
        success: true, 
        message: 'Inventory item created successfully',
        data: {
          ...item.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          category: category ? { category_id: category.category_id, category_name: category.category_name, category_type: category.category_type } : null
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Item code already exists' 
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllItems(req, res) {
    try {
      const items = await InventoryItem.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });

      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const hospital = await Hospital.findByPk(item.hospital_id);
          let category = null;
          if (item.category_id) {
            category = await InventoryCategory.findByPk(item.category_id);
          }
          
          return {
            ...item.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
            category: category ? { category_id: category.category_id, category_name: category.category_name, category_type: category.category_type } : null
          };
        })
      );

      res.json({ success: true, data: itemsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getItemById(req, res) {
    try {
      const item = await InventoryItem.findOne({ where: { item_id: req.params.id, hospital_id: req.hospitalId } });

      if (!item) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      const hospital = await Hospital.findByPk(item.hospital_id);
      let category = null;
      if (item.category_id) {
        category = await InventoryCategory.findByPk(item.category_id);
      }

      res.json({ 
        success: true, 
        data: {
          ...item.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          category: category ? { category_id: category.category_id, category_name: category.category_name, category_type: category.category_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateItem(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await InventoryItem.update(
          { is_active: false },
          { where: { item_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }
        const deactivatedItem = await InventoryItem.findOne({ where: { item_id: req.params.id, hospital_id: req.hospitalId } });
        const hospital = await Hospital.findByPk(deactivatedItem.hospital_id);
        return res.json({ 
          success: true, 
          message: 'Inventory item deactivated successfully', 
          data: {
            ...deactivatedItem.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          }
        });
      }

      const [updated] = await InventoryItem.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { item_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      const updatedItem = await InventoryItem.findOne({ where: { item_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedItem.hospital_id);
      let category = null;
      if (updatedItem.category_id) {
        category = await InventoryCategory.findByPk(updatedItem.category_id);
      }

      res.json({ 
        success: true, 
        data: {
          ...updatedItem.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null,
          category: category ? { category_id: category.category_id, category_name: category.category_name, category_type: category.category_type } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteItem(req, res) {
    try {
      const deleted = await InventoryItem.destroy({
        where: { item_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Inventory item not found' });
      }

      res.json({ success: true, message: 'Inventory item permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = InventoryItemController;
