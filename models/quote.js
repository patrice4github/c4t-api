// basic requires
var sequelize = require('sequelize');

// returns our database connection
var db = require('../tools/db');

//Association Entities
var customers = require('./customer');
var users = require('./user');
var status = require('./status');

// AccessToken model
var quotes = db.define('quotes', {
    id: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'idQuote'
    },
  	reference: {
  		type: sequelize.INTEGER(11),
      allowNull: false,
  		field: 'referNo'
  	},
    idUser: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        references: {
            model: 'Users',
            key: 'idUser'
        }
    },
    idClient: {
        type: sequelize.INTEGER(11),
        allowNull: true,
        references: {
            model: 'Clients',
            key: 'idClient'
        }
    },
    idStatus: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        references: {
            model: 'Status',
            key: 'idStatus'
        },
        defaultValue: '2'
    },
    dtStatusUpdated: {
        type: sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.NOW
    },
    dtCreated: {
        type: sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.NOW
    },
    note: {
        type: sequelize.STRING,
        allowNull: true
    },
    bonus: {
        type: sequelize.DECIMAL,
        allowNull: true,
        defaultValue: 0
    },
    isSatisfactionSMSQuoteSent: {
        type: sequelize.INTEGER(1),
        allowNull: false,
        defaultValue: 0
    },
    smallCarPrice: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    midCarPrice: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    largeCarPrice: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    steelPrice: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    wheelPrice: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    catPrice: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    batteryPrice: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    freeDistance: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    excessCost: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },
    pickup: {
        type: sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0
    },

}, {
    tableName: 'Quotes',
    timestamps: false
});

quotes.belongsTo(users, {as: 'dispatcher', foreignKey: 'idUser'});
quotes.belongsTo(customers, {as: 'customer', foreignKey: 'idClient'});
quotes.belongsTo(status, {as: 'status', foreignKey: 'idStatus'});

quotes.customUpsert = function (options, next) {
    var onUpdate = options.defaults;
    options.defaults = Object.assign(options.defaults, options.oncreate);
    delete options.oncreate;
    this.findOrCreate(options).spread((row, created) => {
        if (created) {
            next(created, row);
        } else {
            options.defaults = onUpdate;
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

module.exports = quotes;
