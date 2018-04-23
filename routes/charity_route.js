var express = require('express');
var router = express.Router();
var db = require('../tools/db');
var charitie = require('../models/charitie');
var isValid = require('../tools/validate');

module.exports = function(app, oauth) {

    //Add a Charitie
    app.post('/charities', [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != 'admin') {
            res.json({"error":"You are not an admin."});
        } else {
            req.body.phone = isValid.phone(req.body.phone);
            if(!req.body.name ||
            req.body.address == undefined ||
            req.body.phone == undefined ||
            req.body.email == undefined ||
            req.body.info == undefined) {
                res.status(400);
                res.json({"error": "Please send all require attributes"});
            } else if(!req.body.name) {
                res.json({"error":"Please enter all require attributes."});
            } else if(req.body.email && !isValid.email(req.body.email)) {
                res.json({"error":"Please enter a valid email address."});
            } else {
                charitie.create({
                    name: req.body.name,
                    address: req.body.address,
                    phone: req.body.phone,
                    email: req.body.email,
                    info: req.body.info
                }).then((r_charitie) => {
                    if(!r_charitie) {
                        res.json({"error":"An error occur on create charitie"});
                    } else {
                        res.json(r_charitie);
                    }
                });
            }
        }
    });

    //Get all charities
    app.get("/charities", [oauth], (req, res) => {
        charitie.findAll().then((charities) => {
            res.json(charities);
        });
    });

    //Get one charitie
    app.get("/charities/:no", [oauth], (req, res) => {
        charitie.findById(req.params.no).then((r_charitie) => {
            if(!r_charitie) {
                res.json({"error": "Charitie not found."});
            } else {
                res.json(r_charitie);
            }
        });
    });

    //edit a Charitie
    app.put('/charities/:no', [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != 'admin') {
            res.json({"error":"You are not an admin."});
        } else {
            req.body.phone = isValid.phone(req.body.phone);
            if(!req.body.name ||
            !req.body.address ||
            !req.body.phone ||
            !isValid.email(req.body.email) ||
            !req.body.info) {
                res.json({"error":"Please send all require attributes."});
            } else {
                charitie.update({
                    name: req.body.name,
                    address: req.body.address,
                    phone: req.body.phone,
                    email: req.body.email,
                    info: req.body.info
                },{
                    where: {
                        id: req.params.no
                    }
                }).then((r_charitie) => {
                    if(!r_charitie) {
                        res.json({"error":"Charitie not found."});
                    } else {
                        res.json(r_charitie);
                    }
                });
            }
        }
    });
};
