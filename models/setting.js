// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');

// business model
const settings = db.define('settings', {
  id: {
    type: sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'idSettings'
  },
  name: {
    type: sequelize.STRING,
    allowNull: false
  },
  label: {
    type: sequelize.STRING,
    allowNull: false
  },
  value: {
    type: sequelize.STRING,
    allowNull: false
  },
  dtCreated: {
    type: sequelize.DATE,
    allowNull: false,
    defaultValue: sequelize.NOW
  }
}, {
  tableName: 'Settings',
  timestamps: false
});

module.exports = settings;
