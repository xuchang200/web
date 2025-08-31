const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  gameId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Games',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  updatedAt: false,
  createdAt: 'grantedAt'
});

module.exports = Permission;