// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');
const HeardOfUs = require("./heardofus");

// Clients model
const Customer = db.define('Customer', {
  id: {
    type: sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'idClient'
  },
  idHeardOfUs: {
      type: sequelize.INTEGER(11),
      allowNull: false,
      references: {
          model: 'HeardsOfUs',
          key: 'idHeardOfUs'
      }
  },
  firstName: {
    type: sequelize.STRING,
    allowNull: false,
    field: 'firstName'
  },
  lastName: {
    type: sequelize.STRING,
    allowNull: false,
    field: 'lastName'
  },
  type: {
    type: sequelize.STRING,
    allowNull: false,
    defaultValue: "Individual"
  },
  email: {
    type: sequelize.STRING,
    allowNull: false,
    field: 'email',
    defaultValue: ""
  },
  phone: {
    type: sequelize.STRING,
    allowNull: false,
    field: 'phone'
  },
  extension: {
    type: sequelize.STRING,
    allowNull: true,
    field: 'extension'
  },
  cellPhone: {
    type: sequelize.STRING,
    allowNull: true,
    field: 'cellPhone'
  },
  secondaryPhone: {
    type: sequelize.STRING,
    allowNull: true,
    field: 'secondaryPhone'
  },
  note: {
    type: sequelize.STRING,
    allowNull: false,
    defaultValue: ""
  },
  grade: {
    type: sequelize.STRING,
    allowNull: false,
    field: 'grade',
    defaultValue: "None"
  },
  customDollarCar: {
      type: sequelize.STRING,
      allowNull: false,
      defaultValue: "0"
  },
  customDollarSteel: {
      type: sequelize.STRING,
      allowNull: false,
      defaultValue: "0"
  },
  customPercCar: {
      type: sequelize.STRING,
      allowNull: false,
      defaultValue: "0"
  },
  customPercSteel: {
      type: sequelize.STRING,
      allowNull: false,
      defaultValue: "0"
  }
}, {
  tableName: 'Clients',
  timestamps: false
});

Customer.belongsTo(HeardOfUs, {as: 'heardofus', foreignKey: 'idHeardOfUs'});
HeardOfUs.hasMany(Customer, {as: 'customers', foreignKey: 'idHeardOfUs'});

// Get customers's name
Customer.prototype.name = function (name) {
    name(this.firstName + ' ' + this.lastName);
};

Customer.customUpsert = function (options, next) {
    this.findOrCreate(options).spread((row, created) => {
        if (created) {
            next(created, row);
        } else {
            this.update(options.defaults, {
                where: options.where
            }).then(updated => {
                this.findById(row.id).then(r_client => {
                    next(created, r_client);
                })
            });
        }
    });
};

module.exports = Customer;
