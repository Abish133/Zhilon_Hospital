const { InventoryCategory, Hospital } = require('../models');

class InventoryCategoryController {
  static async createCategory(req, res) {
    try {
      const { category_name, category_type, hospital_id } = req.body;
      
      if (!category_name || !category_type || !hospital_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category name, category type, and hospital are required' 
        });
      }

      const category = await InventoryCategory.create({ 
        category_name,
        category_type,
        hospital_id
      });

      const hospital = await Hospital.findByPk(hospital_id);

      res.status(201).json({ 
        success: true, 
        message: 'Inventory category created successfully',
        data: {
          ...category.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllCategories(req, res) {
    try {
      const categories = await InventoryCategory.findAll({ where: { is_active: true, hospital_id: req.hospitalId }
      });

      const categoriesWithDetails = await Promise.all(
        categories.map(async (category) => {
          const hospital = await Hospital.findByPk(category.hospital_id);
          
          return {
            ...category.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          };
        })
      );

      res.json({ success: true, data: categoriesWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCategoryById(req, res) {
    try {
      const category = await InventoryCategory.findOne({ where: { category_id: req.params.id, hospital_id: req.hospitalId } });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Inventory category not found' });
      }

      const hospital = await Hospital.findByPk(category.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...category.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateCategory(req, res) {
    try {
      const { is_active, ...updateData } = req.body;

      if (is_active === 0 || is_active === false) {
        const [updated] = await InventoryCategory.update(
          { is_active: false },
          { where: { category_id: req.params.id, hospital_id: req.hospitalId } }
        );
        if (!updated) {
          return res.status(404).json({ success: false, message: 'Inventory category not found' });
        }
        const deactivatedCategory = await InventoryCategory.findOne({ where: { category_id: req.params.id, hospital_id: req.hospitalId } });
        const hospital = await Hospital.findByPk(deactivatedCategory.hospital_id);
        return res.json({ 
          success: true, 
          message: 'Inventory category deactivated successfully', 
          data: {
            ...deactivatedCategory.toJSON(),
            hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
          }
        });
      }

      const [updated] = await InventoryCategory.update(
        { ...updateData, is_active: is_active !== undefined ? is_active : true },
        { where: { category_id: req.params.id, hospital_id: req.hospitalId } }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Inventory category not found' });
      }

      const updatedCategory = await InventoryCategory.findOne({ where: { category_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedCategory.hospital_id);

      res.json({ 
        success: true, 
        data: {
          ...updatedCategory.toJSON(),
          hospital: hospital ? { id: hospital.id, hospitalName: hospital.hospitalName } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteCategory(req, res) {
    try {
      const deleted = await InventoryCategory.destroy({
        where: { category_id: req.params.id, hospital_id: req.hospitalId }
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Inventory category not found' });
      }

      res.json({ success: true, message: 'Inventory category permanently deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = InventoryCategoryController;
