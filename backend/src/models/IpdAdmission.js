'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpdAdmission extends Model {
    static associate(models) {
      IpdAdmission.belongsTo(models.Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      IpdAdmission.belongsTo(models.Doctor, {
        foreignKey: 'admitting_doctor_id',
        as: 'admittingDoctor'
      });
      IpdAdmission.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
      IpdAdmission.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
      IpdAdmission.belongsTo(models.Ward, {
        foreignKey: 'ward_id',
        as: 'ward'
      });
      IpdAdmission.belongsTo(models.Bed, {
        foreignKey: 'bed_id',
        as: 'bed'
      });
      IpdAdmission.belongsTo(models.User, {
        foreignKey: 'admitted_by',
        as: 'admittedBy'
      });
    }
  }
  
  IpdAdmission.init({
    admission_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    uhid: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    admitting_doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'wards',
        key: 'ward_id'
      }
    },
    bed_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'beds',
        key: 'bed_id'
      }
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    bed_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    admission_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    admission_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    provisional_diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    admission_type: {
      type: DataTypes.ENUM('Emergency', 'Planned', 'Transfer'),
      allowNull: false,
      defaultValue: 'Planned'
    },
    referred_by: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    advance_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Admitted', 'Discharged', 'Transferred', 'Absconded', 'LAMA', 'Expired'),
      allowNull: false,
      defaultValue: 'Admitted'
    },
    admitted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
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
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'IpdAdmission',
    tableName: 'ipd_admissions',
    timestamps: true
  });
  
  return IpdAdmission;
};
