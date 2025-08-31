const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  coverImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  gameEntryPath: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('published', 'draft'),
    defaultValue: 'draft',
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Game file size in bytes'
  },
  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0.0',
    validate: {
      is: /^\d+\.\d+\.\d+$/
    }
  }
}, {
  timestamps: true,
  paranoid: true, // 软删除支持
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['title']
    }
  ]
});

module.exports = Game;