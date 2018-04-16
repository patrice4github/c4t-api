var sequelize = require('sequelize');

// database connection
var db = new sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIAL,
    timezone: "+00:00",
    logging: false,
    operatorsAliases: false,
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

module.exports = db;
