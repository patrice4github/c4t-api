var express = require('express');
var router = express.Router();
var users = require('../models/user');
var crypto = require('crypto');
var sequelize = require('sequelize');

module.exports = function(app, oauth) {
    // Obtain a token
    app.post('/token', (req, res) => {
        console.log("=============================");
        console.log(req.body);
        console.log("=============================");

        if(!req.body.client_id ||
           !req.body.client_secret ||
           !req.body.grant_type ||
           req.body.grant_type != "client_credentials") {

           // Logging for debugging the mobile
           if(!req.body.client_id) {
             console.log("API token missing client_id");
           }
           if(!req.body.client_secret) {
             console.log("API token missing client_secret");
           }
           if(!req.body.grant_type) {
             console.log("API token missing grant_type");
           }
           res.send('{"error": "Missing parameters"}');

        } else {
            users.findOne({
                where: {
                    username: req.body.client_id,
                    isActive: true
                }
            }).then(function(user) {
                if(!user || !user.isValidPassword(req.body.client_secret)) {
                    res.send('{"error": "Invalid Authentication"}');
                } else {
                    var token = {};
                    token.token_type = "Bearer";
                    token.access_token = crypto.randomBytes(128).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, 'j');
                    token.expires_in = 3600;
                    users.update(
                        // Set Attribute values
                        {
                            accessToken: token.token_type + " " + token.access_token,
                            dtLastLogin: sequelize.fn('NOW')
                        },
                        // Where clause / criteria
                        { where: { id : user.id }
                    }).then(function(userUpdated) {
                        res.send(token);
                    });
                }
            });
        }
    })

    // Validate token
    .get('/token', [oauth], (req, res) => {
        res.send('{"message":"token is good"}');
    })

    // Logout
    .delete('/user/:id', [oauth], (req, res) => {
        users.update(
            // Set Attribute values
            { accessToken: null },
            // Where clause / criteria
            { accessToken : req.headers.Authorization }
        ).then(user => {
            res.send('{"message":"No more token!"}');
        });
    });
};
