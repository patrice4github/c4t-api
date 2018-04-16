// basic requires
var sequelize = require('sequelize');

// returns our database connection
const db = require('../tools/db');

//Association Entities
var client = require('./customer');

// address model
const address = db.define('address', {
    id: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'idAddress'
    },
    idClient: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        references: {
            model: 'Clients',
            key: 'idClient'
        }
    },
    address: {
        type: sequelize.STRING,
        allowNull: false
    },
    city: {
        type: sequelize.STRING,
        allowNull: false
    },
    postal: {
        type: sequelize.STRING,
        allowNull: false
    },
    province: {
        type: sequelize.STRING,
        allowNull: false
    },
    distance: {
        type: sequelize.STRING,
        allowNull: false
    }
}, {
    tableName: 'Address',
    timestamps: false
});

address.prototype.formatLong = function () {
    return this.address + " " + this.city + ", " + this.province;
};

client.hasMany(address, {as: 'address', foreignKey: 'idClient'});
address.belongsTo(client, {as: 'customer', foreignKey: 'idClient'});

module.exports = address;
