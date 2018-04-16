// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');

// business model
const status = db.define('status', {
  id: {
    type: sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'idStatus'
  },
  name: {
    type: sequelize.STRING,
    allowNull: false
  },
  color: {
    type: sequelize.STRING,
    allowNull: false
  }
}, {
  tableName: 'Status',
  timestamps: false
});

module.exports = status;
