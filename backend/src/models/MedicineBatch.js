'use strict';
const { Model } = require('sequelize');
 
module.exports = (sequelize, DataTypes) => {
  class MedicineBatch extends Model {
    static associate(models) {
      MedicineBatch.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
      });
      MedicineBatch.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      MedicineBatch.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        as: 'vendor'
      });
      MedicineBatch.belongsTo(models.PurchaseOrder, {
        foreignKey: 'po_id',
        as: 'purchaseOrder'
      });
      MedicineBatch.belongsTo(models.GoodsReceiptNote, {
        foreignKey: 'grn_id',
        as: 'grn'
      });
    }
  }
 
  MedicineBatch.init({
    batch_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    medicine_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'medicines',
        key: 'medicine_id'
      }
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hospitals',
        key: 'id'
      }
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    purchase_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    selling_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    received_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    available_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vendors',
        key: 'vendor_id'
      }
    },
    received_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_orders',
        key: 'po_id'
      }
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'MedicineBatch',
    tableName: 'medicine_batches',
    timestamps: true,
    hooks: {
      afterCreate: async (batch, options) => {
        await updateMedicineStock(batch.medicine_id, sequelize.models);
      },
      afterUpdate: async (batch, options) => {
        await updateMedicineStock(batch.medicine_id, sequelize.models);
      },
      afterDestroy: async (batch, options) => {
        await updateMedicineStock(batch.medicine_id, sequelize.models);
      },
      afterBulkUpdate: async (options) => {
        if (options.where && options.where.medicine_id) {
          await updateMedicineStock(options.where.medicine_id, sequelize.models);
        }
      }
    }
  });

  async function updateMedicineStock(medicine_id, models) {
    try {
      const result = await models.MedicineBatch.findAll({
        where: { medicine_id, is_active: true },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('available_quantity')), 'total_stock']
        ],
        raw: true
      });
      const totalStock = parseInt(result[0].total_stock, 10) || 0;
      await models.Medicine.update(
        { available_quantity: totalStock },
        { where: { medicine_id } }
      );
    } catch (error) {
      console.error(`Failed to update Medicine stock for ID ${medicine_id}:`, error);
    }
  }
 
  return MedicineBatch;
};