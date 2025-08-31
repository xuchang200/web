const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// If DB_HOST is defined in .env, use MySQL, otherwise fallback to SQLite for development
if (process.env.DB_HOST) {
  console.log('Using MySQL database...');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );
} else {
  console.log('Using SQLite database...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './dev.sqlite',
    logging: false,
  });
}

module.exports = sequelize;