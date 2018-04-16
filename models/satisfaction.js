// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');
var client = require("./customer");

// satisfaction model
const satisfaction = db.define('Satisfaction', {
  id: {
    type: sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'idSatisfaction'
  },
  idClient: {
    type: sequelize.INTEGER(11),
    allowNull: false
  },
  dtAdded: {
    type: sequelize.DATE,
    allowNull: false,
    defaultValue: sequelize.NOW
  },
  from: {
    type: sequelize.STRING,
    allowNull: false
  },
  satisfaction: {
      type: sequelize.INTEGER(11),
      allowNull: false
  }
}, {
  tableName: 'Satisfactions',
  timestamps: false
});

satisfaction.belongsTo(client, {as: "client", foreignKey: "idClient"});
client.hasMany(satisfaction, {as: "satisfactions", foreignKey: "idClient"});

module.exports = satisfaction;
