var express = require('express');
var router = express.Router();
var db = require('../tools/db');
var HeardsOfUs = require('../models/heardofus');

module.exports = function(app, oauth) {

    app.post("/heardsofus", [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != 'admin') {
            res.status(401);
            res.json({"error":"You are not an admin."});
        } else {
            if(!req.body.type) {
                res.status(400);
                res.json({"error":"Please send type attributes."});
            } else {
                HeardsOfUs.findOrCreate({
                    where: {
                        type: req.body.type
                    },
                    defaults: {
                        type: req.body.type
                    }
                }).spread((heardOfUs, created) => {
                    if(!created) {
                        res.status(400);
                        res.json({"error":"Type already exist."});
                    } else {
                        res.json(heardOfUs);
                    }
                });
            }
        }
    })

    .get("/heardsofus", [oauth], (req, res) => {
        HeardsOfUs.findAll().then(heardsOfUs => {
            res.json(heardsOfUs);
        });
    })

    .get("/heardsofus/:no", [oauth], (req, res) => {
        HeardsOfUs.findById(req.params.no).then(heardOfUs => {
            if(!heardOfUs) {
                res.status(404);
                res.json({"error": "HeardOfUs not found."});
            } else {
                res.json(heardOfUs);
            }
        });
    })

    .put('/heardsofus/:no', [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != 'admin') {
            res.status(401);
            res.json({"error":"You are not an admin."});
        } else if(!req.body.type) {
            res.status(400);
            res.json({"error":"Please send type attributes."});
        } else {
            HeardsOfUs.update({
                type: req.body.type
            },{
                where: {
                    id: req.params.no
                }
            }).then(heardOfUs => {
                if(!heardOfUs) {
                    res.status(404);
                    res.json({"error":"HeardOfUs not found."});
                } else {
                    res.json(heardOfUs);
                }
            });
        }
    })
};
