var express = require('express');
var router = express.Router();
var db = require('../tools/db');
var schedule = require('../models/schedule');
var car = require('../models/quotecar');
var address = require('../models/address');
var quote = require('../models/quote');
var vehicle = require('../models/vehicleinfo');
var client = require('../models/customer');
var user = require('../models/user');
var status = require('../models/status');
var async = require('async');

module.exports = function(app, oauth) {

    //upsert schedule
    app.post('/schedules', [oauth], (req, res) => {
        //Validate body data before insert.
        if(!req.body.idCar ||
           !req.body.truck ||
           !req.body.dtStart) {
            res.status(400);
            res.json({"error":"please send all require attributes."});
        } else {
            //Check if id car exist.
            car.findById(req.body.idCar).then(quoteCar => {
                if(!quoteCar) {
                    res.status(404);
                    res.json({"error": "Car not found!"});
                } else {
                    if(req.body.dtEnd == "") {
                      req.body.dtEnd = null;
                    }
                    //Check if we insert or update.
                    schedule.findOne({
                        where: {
                            idCar: req.body.idCar
                        }
                    }).then(sched => {
                        if(!sched) {
                            //Insert
                            schedule.create({
                                idCar: req.body.idCar,
                                truck: req.body.truck,
                                dtStart: req.body.dtStart,
                                dtEnd: req.body.dtEnd
                            }).then(newOne => {
                                res.json(newOne);
                            });
                        } else {
                            //Update
                            schedule.update({
                                truck: req.body.truck,
                                dtStart: req.body.dtStart,
                                dtEnd: req.body.dtEnd
                            }, {
                                where: {
                                    idCar: req.body.idCar
                                }
                            }).then(newOne => {
                                res.json(newOne);
                            });
                        }
                    });
                }
            });
        }
    })

    // get all schedules.
    .get('/schedules', (req, res) => {
        schedule.findAll({
            include: [{
                model: car, as: 'car',
                include: [{
                    model: quote, as: 'quote',
                    include: [{
                        model: client, as: 'customer'
                    }, {
                        model: user, as: 'dispatcher'
                    }, {
                        model: status, as: 'status'
                    }]
                },{
                    model: vehicle, as: 'information'
                },{
					model: address, as: 'address'
				}]
            }]
        }).then(selected => {
            res.json(selected);
        });
    })

    // get one schedule, selected by idCar
    .get('/schedules/:no', [oauth], (req, res) => {
        schedule.findOne({
            where: { idCar: req.params.no },
            include:[
                {model: car, as: 'car'}
            ]
        }).then((selected) => {
            if(!selected) {
                res.json({"error": "Car not found!"});
            } else {
                res.json(selected);
            }
        });
    })

    //delete a schedule, selected by idCar
    .delete('/schedules/:no', [oauth], (req, res) => {
        schedule.destroy({
            where: {
                idCar: req.params.no
            }
        }).then((results) => {
            res.json({"message":"Schedules deleted!"});
        });
    });
}
