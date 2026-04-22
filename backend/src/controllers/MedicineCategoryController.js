const { MedicineCategory, Hospital } = require('../models');
 
class MedicineCategoryController {
  static async createCategory(req, res) {
    try {
      if (!req.body.category_name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }
 
      const category = await MedicineCategory.create(req.body);
      const hospital = await Hospital.findByPk(req.body.hospital_id);
     
      res.status(201).json({
        success: true,
        data: {
          ...category.toJSON(),
          hospital: hospital ? { id: hospital.id, name: hospital.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async getAllCategories(req, res) {
    try {
      const categories = await MedicineCategory.findAll({
        where: { hospital_id: req.hospitalId }
      });
     
      const categoriesWithDetails = await Promise.all(
        categories.map(async (category) => {
          const hospital = await Hospital.findByPk(category.hospital_id);
          return {
            ...category.toJSON(),
            hospital: hospital ? { id: hospital.id, name: hospital.name } : null
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
      const category = await MedicineCategory.findOne({ where: { category_id: req.params.id, hospital_id: req.hospitalId } });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
     
      const hospital = await Hospital.findByPk(category.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...category.toJSON(),
          hospital: hospital ? { id: hospital.id, name: hospital.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async updateCategory(req, res) {
    try {
      const [updated] = await MedicineCategory.update(req.body, {
        where: { category_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      const updatedCategory = await MedicineCategory.findOne({ where: { category_id: req.params.id, hospital_id: req.hospitalId } });
      const hospital = await Hospital.findByPk(updatedCategory.hospital_id);
     
      res.json({
        success: true,
        data: {
          ...updatedCategory.toJSON(),
          hospital: hospital ? { id: hospital.id, name: hospital.name } : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  static async deleteCategory(req, res) {
    try {
      const deleted = await MedicineCategory.destroy({
        where: { category_id: req.params.id, hospital_id: req.hospitalId }
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
 
module.exports = MedicineCategoryController;
 