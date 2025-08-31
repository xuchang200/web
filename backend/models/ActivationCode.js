const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivationCode = sequelize.define('ActivationCode', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [6, 20]
    }
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Games',
      key: 'id',
    }
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  usedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    }
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '激活码过期时间'
  },
  batchId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '批次标识，用于批量生成的激活码'
  }
}, {
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['code'],
      unique: true
    },
    {
      fields: ['gameId']
    },
    {
      fields: ['isUsed']
    },
    {
      fields: ['batchId']
    }
  ]
});

module.exports = ActivationCode;