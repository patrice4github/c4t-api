var sequelize = require('sequelize');
const db = require('../tools/db');

const vehiclesinfo = db.define('vehiclesinfo', {
    id: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'idVehiculeInfo'
    },
    year: {
        type: sequelize.INTEGER(4),
        allowNull: false
    },
    make: {
        type: sequelize.STRING,
        allowNull: false
    },
    model: {
        type: sequelize.STRING,
        allowNull: false
    },
    trim: {
        type: sequelize.STRING,
        allowNull: true
    },
    body: {
        type: sequelize.STRING,
        allowNull: true
    },
    drive: {
        type: sequelize.STRING,
        allowNull: true
    },
    transmission: {
        type: sequelize.STRING,
        allowNull: true
    },
    seats: {
        type: sequelize.INTEGER(11),
        allowNull: true
    },
    doors: {
        type: sequelize.INTEGER(11),
        allowNull: true
    },
    weight: {
        type: sequelize.INTEGER(11),
        allowNull: false
    }
}, {
    tableName: 'VehiculesInfo',
    timestamps: false
});

module.exports = vehiclesinfo;
