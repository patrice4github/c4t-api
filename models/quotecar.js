// basic requires
var sequelize = require('sequelize');

// returns our database connection
var db = require('../tools/db');

//Association Entities
var quotes = require('./quote');
var vehicles = require('./vehicleinfo');
var address = require('./address');

// AccessToken model
var cars = db.define('quotecar', {
    id: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'idQuoteCars'
    },
    idQuote: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        references: {
            model: 'Quotes',
            key: 'idQuote'
        }
    },
    idCar: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        references: {
            model: 'VehiclesInfo',
            key: 'idVehicleInfo'
        }
    },
    idAddress: {
        type: sequelize.INTEGER(11),
        allowNull: true,
        references: {
            model: 'Address',
            key: 'idAddress'
        }
    },
    missingWheels: {
        type: sequelize.TINYINT,
        allowNull: false
    },
    missingBattery: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    missingCat: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    donation: {
        type: sequelize.STRING,
        allowNull: true
    },
    gettingMethod: {
        type: sequelize.STRING,
        allowNull: false
    },
    isTowable: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    gotKeys: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    drivetrain: {
        type: sequelize.STRING,
        allowNull: true
    },
    tiresCondition: {
        type: sequelize.STRING,
        allowNull: true
    },
    ownership: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    running: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    complete: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    color: {
        type: sequelize.STRING,
        allowNull: true
    },
    receipt: {
        type: sequelize.STRING,
        allowNull: true
    },
    vin: {
        type: sequelize.STRING,
        allowNull: true
    },
    ownershipName: {
        type: sequelize.STRING,
        allowNull: true
    },
    ownershipAddress: {
        type: sequelize.STRING,
        allowNull: true
    },
    cashRegular: {
        type: sequelize.INTEGER(11),
        allowNull: true
    },
    dateBooked: {
        type: sequelize.DATE,
        allowNull: true
    },
    timeBooked: {
        type: sequelize.STRING,
        allowNull: true
    },
    carNotes: {
        type: sequelize.STRING,
        allowNull: true
    },
    driverNotes: {
        type: sequelize.STRING,
        allowNull: true
    },
    canDo2wd: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    canGoNeutral: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    distance: {
        type: sequelize.DECIMAL,
        allowNull: true,
    },
    price: {
        type: sequelize.DECIMAL,
        allowNull: true,
    },

}, {
    tableName: 'QuotesCars',
    timestamps: false
});

cars.belongsTo(quotes, {as: 'quote', foreignKey: 'idQuote'});
quotes.hasMany(cars, {as: 'cars', foreignKey: 'idQuote'});

cars.belongsTo(vehicles, {as: 'information', foreignKey: 'idCar'});

cars.belongsTo(address, {as: 'address', foreignKey: 'idAddress'});
address.hasOne(cars, {foreignKey: 'idAddress'});

module.exports = cars;
