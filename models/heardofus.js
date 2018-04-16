// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');

// heardofus model
const HeardOfUs = db.define('HeardOfUs', {
  id: {
    type: sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'idHeardOfUs'
  },
  type: {
    type: sequelize.STRING(60),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'HeardsOfUs',
  timestamps: false
});

module.exports = HeardOfUs;
