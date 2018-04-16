// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');

//Association Entities
var Business = require('./business');

// business model
const Contact = db.define('Contact', {
  id: {
    type: sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'idContact'
  },
  idBusiness: {
    type: sequelize.INTEGER(11),
    references: {
        model: 'Business',
        key: 'idClient'
    },
    allowNull: false
  },
  firstName: {
    type: sequelize.STRING,
    allowNull: false
  },
  lastName: {
    type: sequelize.STRING,
    allowNull: false
  },
  paymentMethod: {
    type: sequelize.STRING,
    allowNull: false
  }
}, {
  tableName: 'Contacts',
  timestamps: false
});

Business.hasMany(Contact, {as: 'contacts', foreignKey: 'idBusiness'});
Contact.belongsTo(Business, {as: 'business', foreignKey: 'idBusiness'});

module.exports = Contact;
