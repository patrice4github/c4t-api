// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');

// charitie model
const charitie = db.define('Charitie', {
    id: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'idCharitie'
    },
    name: {
        type: sequelize.STRING,
        allowNull: false
    },
    address: {
        type: sequelize.STRING,
        allowNull: false
    },
    phone: {
        type: sequelize.STRING,
        allowNull: false
    },
    email: {
        type: sequelize.STRING,
        allowNull: false
    },
    info: {
        type: sequelize.STRING,
        allowNull: false
    }
}, {
    tableName: 'Charities',
    timestamps: false
});

module.exports = charitie;
