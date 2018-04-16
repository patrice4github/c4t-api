// basic requires
var sequelize = require('sequelize');

// password verification
var hashers = require('node-django-hashers');
var hasher = new hashers.BCryptSHA256PasswordHasher();

// returns our database connection
var db = require('../tools/db');

// User model
var users = db.define('users', {
    id: {
        type: sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'idUser'
    },
    username: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'username'
    },
    password: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'password'
    },
    roles: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'roles'
    },
    firstName: {
        type: sequelize.STRING,
        allowNull: false,
        field: 'firstName'
    },
    lastName: {
        type: sequelize.STRING,
        allowNull: false
    },
    email: {
        type: sequelize.STRING,
        allowNull: false
    },
    phone: {
        type: sequelize.STRING,
        allowNull: true
    },
    dtCreated: {
        type: sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.NOW
    },
    dtLastLogin: {
        type: sequelize.DATE,
        allowNull: false,
        field: 'dtLastLogin',
        defaultValue: sequelize.NOW
    },
    accessToken: {
        type: sequelize.STRING,
        allowNull: true,
        field: 'accessToken'
    },
    isActive: {
        type: sequelize.INTEGER(1),
        allowNull: false,
        field: 'isActive',
        defaultValue: true
    },
    isSuperadmin: {
        type: sequelize.INTEGER(1),
        allowNull: false,
        field: 'isSuperadmin',
        defaultValue: false
    },
    avatar: {
        type: sequelize.STRING,
        allowNull: true,
        field: 'avatar'
    }
}, {
    tableName: 'Users',
    timestamps: false
});

// Get User's name from person
users.prototype.name = function (name) {
    name(this.firstName + ' ' + this.lastName);
};

users.prototype.isValidPassword = function(password) {
    return(hasher.verify(password, this.password));
}

module.exports = users;
