var express = require('express');
var router = express.Router();
var db = require('../tools/db');
var settings = require('../models/setting');
var async = require('async');

module.exports = function(app, oauth) {

    //Get last saved settings
    app.get('/settings', [oauth], (req, res) => {
        db.query("SELECT * FROM Settings WHERE dtCreated IN (SELECT MAX(dtCreated) FROM Settings GROUP BY name)", {
            type: db.QueryTypes.SELECT
        }).then(lastSettings => {
            res.json(lastSettings);
        });
    })

    // get settings from all update.
    .get('/settings/all', [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != 'admin') {
            res.json({"error":"You are not an admin."});
        } else {
            settings.findAll()
            .then(function(allSettings) {
                async.each(allSettings, function(setting, next) {
                    //TODO! Format each user before send it.
                    next();
                },function(){
                    res.json(allSettings);
                });
            });
        }
    })

    //Update settings
    .put("/settings", [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != 'admin') {
            res.json({"error":"You are not an admin."});
        } else {
            var j = 0;
            var l = req.body.settings.length;
            async.each(req.body.settings, function(setting, next) {
              settings.update(
                {
                  name: setting.name,
                  label: setting.name,
                  value: setting.value,
                  grade: setting.grade
                }, {
                  where: {
                    name: setting.name,
                    grade: setting.grade
                  }

                })
              .then((updated)=> {
                j += 1;
                if (j >= l) {
                  res.json({"message":"Settings is updated."});
                }
              });
            },function() {
            });
        }
    });
};
