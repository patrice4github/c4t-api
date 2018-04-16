// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');

//Association Entities
var client = require('./customer');

// business model
const business = db.define('business', {
  id: {
    type: sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    references: {
        model: 'Clients',
        key: 'idClient'
    },
    field: 'idClient'
  },
  name: {
    type: sequelize.STRING,
    allowNull: false
  },
  description: {
    type: sequelize.STRING,
    allowNull: false
  },
  contactPosition: {
    type: sequelize.INTEGER(1),
    allowNull: false
  },
  pstTaxNo: {
    type: sequelize.INTEGER(1),
    allowNull: false
  },
  gstTaxNo: {
    type: sequelize.INTEGER(1),
    allowNull: false
  }
}, {
  tableName: 'Business',
  timestamps: false
});

client.hasOne(business, {as: 'business', foreignKey: 'idClient'});
business.belongsTo(client, {as: 'business', foreignKey: 'idClient'});

module.exports = business;
