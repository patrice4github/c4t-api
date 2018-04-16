// basic requires
var sequelize = require('sequelize');

// returns our database connection
var db = require('../tools/db');

//Association Entities
var QuotesCars = require('./quotecar');

// schedule model
var schedule = db.define('schedule', {
    id: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'idSchedule'
    },
    idCar: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        references: {
            model: 'QuotesCars',
            key: 'idQuoteCars'
        }
    },
    truck: {
        type: sequelize.STRING,
        allowNull: false
    },
    dtStart: {
        type: sequelize.DATE,
        allowNull: false
    },
    dtEnd: {
        type: sequelize.DATE,
        allowNull: true
    }
}, {
    tableName: 'Schedules',
    timestamps: false
});

QuotesCars.hasOne(schedule, {as: 'schedule', foreignKey: 'idCar'});
schedule.belongsTo(QuotesCars, {as: 'car', foreignKey: 'idCar'});

module.exports = schedule;
