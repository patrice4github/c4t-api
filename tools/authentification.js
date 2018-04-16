var express = require('express');
var app = module.exports = express();
var sequelize = require('./db');

module.exports = function(req, res, next) {
    if(!req.headers.authorization) {
        res.send('{"error":"Please provide Authorization in headers"}');
    } else {
        sequelize.query("SELECT * FROM Users WHERE dtLastLogin >= (NOW() - INTERVAL 1 HOUR) AND isActive = 1 AND accessToken = ?;",
        {
            replacements: [req.headers.authorization],
            type: sequelize.QueryTypes.SELECT
        }).then(user => {
            if(user.length != 0){
                if(user[0].phone == null) {
                    user[0].phone = "";
                }
                req.user = user[0];
                next();
            } else {
                res.send('{"error": "Invalid Authentication"}')  ;
            }
        });
    }
};
