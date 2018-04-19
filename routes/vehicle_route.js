var express = require('express');
var router = express.Router();
var vehiclesinfo = require('../models/vehicleinfo');
var quote = require('../models/quote');
var cars = require('../models/quotecar');
var users = require('../models/user');
var status = require('../models/status');
var client = require('../models/customer');
var address = require('../models/address');
var isValid = require("../tools/validate");
var db = require('../tools/db');
const Op = db.Op;

module.exports = function(app, oauth) {
    //Add vehicle info.
    app.post('/vehicles', [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != 'admin') {
            res.json({"error":"You are not an admin."});
        } else {
            if(!isValid.integer(req.body.year) ||
            !req.body.make ||
            !req.body.model ||
            !isValid.integer(req.body.weight)) {
                res.json({"error":"Please send all require attributes."});
            } else {
                vehiclesinfo.create({
                    year: req.body.year,
                    make: req.body.make,
                    model: req.body.model,
                    trim: req.body.trim,
                    body: req.body.body,
                    drive: req.body.drive,
                    transmission: req.body.transmission,
                    seats: req.body.seats,
                    doors: req.body.doors,
                    weight: req.body.weight
                }).then(r_vehicle => {
                    res.json(r_vehicle);
                });
            }
        }
    })

    //GET all existant vehicles information with filter
    .get('/vehicles', [oauth], (req, res) => {
        var limit = 30;
        var offset = 0;
        var where = {};
        if(req.query.limit != null && Number.isInteger(Number(req.query.limit)) && Number(req.query.limit) > 0) {
            limit = Number(req.query.limit);
        }
        if(req.query.offset != null && Number.isInteger(Number(req.query.offset)) && Number(req.query.offset) >= 0) {
            offset = Number(req.query.offset) * limit;
        }
        if(req.query.filter) {
            req.query.filter = "%" + req.query.filter.replace(/[\s]/g, "% %") + "%";
            var filters = req.query.filter.split(' ');
			var and = [];
			filters.forEach(fil => {
				and.push({
					[Op.or]: [
                        {year: { [Op.like]: fil }},
                        {make: { [Op.like]: fil }},
                        {model: { [Op.like]: fil }},
                        {trim: { [Op.like]: fil }},
                        {body: { [Op.like]: fil }},
                        {drive: { [Op.like]: fil }},
                        {transmission: { [Op.like]: fil }},
                        {seats: { [Op.like]: fil }},
                        {doors: { [Op.like]: fil }},
                        {weight: { [Op.like]: fil }}
					]
				});
			});
			where = { [Op.and]: and };
        }
        vehiclesinfo.findAll({
            where: where,
            offset: offset,
            limit: limit
        }).then(function(r_vehicles) {
            res.json(r_vehicles);
        });
    })

    //GET total results.
    .get("/vehicles/count", [oauth], (req, res) => {
        var where = {};
        var limit = 30;
        if(req.query.limit != null && Number.isInteger(Number(req.query.limit)) && Number(req.query.limit) > 0) {
            limit = Number(req.query.limit);
        }
        if(req.query.filter) {
            req.query.filter = "%" + req.query.filter.replace(/[\s]/g, "% %") + "%";
            var filters = req.query.filter.split(' ');
			var and = [];
			filters.forEach(fil => {
				and.push({
					[Op.or]: [
                        {year: { [Op.like]: fil }},
                        {make: { [Op.like]: fil }},
                        {model: { [Op.like]: fil }},
                        {trim: { [Op.like]: fil }},
                        {body: { [Op.like]: fil }},
                        {drive: { [Op.like]: fil }},
                        {transmission: { [Op.like]: fil }},
                        {seats: { [Op.like]: fil }},
                        {doors: { [Op.like]: fil }},
                        {weight: { [Op.like]: fil }}
					]
				});
			});
			where = { [Op.and]: and };
        }
        vehiclesinfo.count({
            where: where
        }).then(function(r_vehicles) {
            res.json(Math.ceil(r_vehicles/limit));
        });
    })

    //GET one specific vehicle information
    .get('/vehicles/:no', [oauth], (req, res) => {
        vehiclesinfo.findOne({
            where: { id: req.params.no }
        }).then((info) => {
            if(!info)
                res.send('{"error": "Vehicle not found!"}');
            else
                res.send(info);
        });
    })

};
