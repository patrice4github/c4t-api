var express = require('express');
var router = express.Router();
var isValid = require('../tools/validate');
var client = require('../models/customer');
var address = require('../models/address');
var db = require('../tools/db');
const Op = db.Op;
var request = require("../tools/request");
var qs = require("querystring");

module.exports = function(app, oauth) {
    //Add an address to customer.
    app.post("/clients/:no/address", [oauth], (req, res) => {
        console.log("####--- In Address Route JS ---###",req,addresses);
        if(!req.body.address ||
        !req.body.city ||
        !req.body.postal ||
        !req.body.province) {
            res.json({"error":"Please send all require attributes."});
        } else {
            //Verify address.
            isValid.address(req.body.address + " " + req.body.city + ", " + req.body.province, r_address => {
                if(r_address === false) {
                    res.json({"error": "Address not exist."});
                } else {
                    var addressComponents = isValid.formatAddressComponents(r_address.address_components);
                    //Calculate distance with google map.
                    var twoAddress = "7628 Flewellyn Rd Stittsville, ON, K2S 1B6|" + r_address.formatLong();
                    var url = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + process.env.GOOGLE_MAP_TOKEN +
                    '&' + qs.stringify({
                        origins: twoAddress,
                        destinations: twoAddress
                    });
                    request.custom("GET", url, {}, {}, distance => {
                        var going = 0;
                        var returning = 0;
                        if(distance.rows && distance.rows.length == 2 && distance.rows[0].elements && distance.rows[0].elements[1].status == "OK") {
                            going = distance.rows[0].elements[1].distance.value;
                            returning = distance.rows[1].elements[0].distance.value;
                        }
                        //Verify customer exist.
                        client.findById(req.params.no).then(customer => {
                            if(!customer) {
                                res.json({"error":"Client not found"});
                            } else {
                    async.each(req.body.addresses, (address, next) => {
                         address.create({
                                    idClient: req.params.no,
                                    address: addressComponents.street_number + " " + addressComponents.route,
                                    city: addressComponents.locality,
                                    postal: addressComponents.postal_code,
                                    province: addressComponents.administrative_area_level_1,
                                    distance: Number(going) + Number(returning)
                            }).then(newAddress => {
                                    res.json(newAddress);
                                });
                        }, function() {
                            client.findById(req.params.no, {
                                include: [{
                                    model: address, as: "addresses"
                                }]
                            }).then(client => {
                                res.json(addresses);
                            });
                        });
                            }
                        });
                    });
                }
            });
        }
    })

    //Find all address of a customer with filter.
    .get("/clients/:no/address", [oauth], (req, res) => {
        var limit = 10;
        var offset = 0;
        var where = {idClient: req.params.no};
        if(req.query.offset != null && Number.isInteger(Number(req.query.offset))) {
            offset = Number(req.query.offset);
        }
        if(req.query.limit != null && Number.isInteger(Number(req.query.limit))) {
            limit = Number(req.query.limit);
        }
        if(req.query.filter) {
            req.query.filter = "%" + req.query.filter.replace(/[\s]/g, "% %") + "%";
            var filters = req.query.filter.split(' ');
			var and = [];
			filters.forEach(fil => {
				and.push({
					[Op.or]: [
                        {address: { [Op.like]: fil }},
                        {city: { [Op.like]: fil }},
                        {postal: { [Op.like]: fil }},
                        {province: { [Op.like]: fil }}
					]
				});
			});
			where = {
                idClient: req.params.no,
				[Op.and]: and
			};
        }
        address.findAll({
            include: [{
                model: client,
                as: "customer"
            }],
            where: where,
            order: [
                ['address', 'ASC'],
                ['city', 'ASC']
            ],
            offset: offset,
            limit: limit
        }).then(lst => {
            res.json(lst);
        });
    })

    //Get distance and additionnal price for go to an address
    .get("/address/:no/distance", [oauth], (req, res) => {
        //Check if address exist.
        address.findById(req.params.no).then(r_address => {
            if(!r_address) {
                res.json({"error": "Address not found."});
            } else {
                //Calculate distance with google map.
                var twoAddress = "7628 Flewellyn Rd Stittsville, ON, K2S 1B6|" + r_address.formatLong();
                var url = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + process.env.GOOGLE_MAP_TOKEN +
                '&' + qs.stringify({
                    origins: twoAddress,
                    destinations: twoAddress
                });
                request.custom("GET", url, {}, {}, distance => {
                    //Get settings.
                    db.query("SELECT * FROM Settings WHERE dtCreated IN (SELECT MAX(dtCreated) FROM Settings GROUP BY name)", {
                        type: db.QueryTypes.SELECT
                    }).then(r_setting => {
                        var freeDistance = r_setting.find(set => {
                            return set.name == "freeDistance"
                        }).value;
                        var excessPrice = r_setting.find(set => {
                            return set.name == "excessPrice"
                        }).value;

                        if(!distance.rows || distance.rows.length == 0 || !distance.rows[0].elements || distance.rows[0].elements[1].status != "OK") {
                            res.status(404);
                            res.json({"error": "Address is invalid."});
                        } else {
                            //excessDistance = goingDistance + comingBackDistance - freeDistance
                            var excessDistance = distance.rows[0].elements[1].distance.value/1000 + distance.rows[1].elements[0].distance.value/1000 - freeDistance;
                            var additionnalPrice = (excessPrice * excessDistance).toFixed(2);
                            res.json({
                                "origin": "7628 Flewellyn Rd Stittsville, ON, K2S1B6",
                                "destination": r_address.formatLong(),
                                "goingDistance": distance.rows[0].elements[1].distance.value/1000,
                                "goingDuration": distance.rows[0].elements[1].duration.value,
                                "comingBackDistance": distance.rows[1].elements[0].distance.value/1000,
                                "comingBackDuration": distance.rows[1].elements[0].duration.value,
                                "totalDistance": distance.rows[0].elements[1].distance.value/1000 + distance.rows[1].elements[0].distance.value/1000,
                                "freeDistance": freeDistance,
                                "excessDistance": excessDistance,
                                "excessPrice": excessPrice,
                                "additionnalPrice": additionnalPrice
                            });
                        }
                    });
                });
            }
        });
    })
}
