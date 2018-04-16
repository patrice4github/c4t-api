var express = require('express');
var router = express.Router();
var validate = require('../tools/validate');
var clients = require('../models/customer');
var HeardOfUs = require("../models/heardofus");
var business = require('../models/business');
var contact = require("../models/contact");
var address = require('../models/address');
var users = require('../models/user');
var db = require('../tools/db');
const Op = db.Op;
const isValid = require("../tools/validate");
var qs = require("querystring");
var request = require("../tools/request");
var async = require('async');

module.exports = function(app, oauth) {

    //Create a customer
    app.post('/clients', [oauth], (req, res) => {
        //Validate body data before insert.
        if(!req.body.firstName ||
           req.body.lastName == null ||
           req.body.email == null ||
           !req.body.type ||
           !req.body.address ||
           !req.body.city ||
           req.body.postal == null ||
           !req.body.province ||
           !req.body.phoneNumber ||
           req.body.grade == null ||
           req.body.note == null ||
           !req.body.heardOfUs) {
            res.json({"error":"Please send all require attributes."});
        } else if(req.body.type != "Individual" &&
                  (!req.body.name ||
                   req.body.description == null ||
                   !req.body.contactPosition ||
                   !req.body.pstTaxNo ||
                   !req.body.gstTaxNo)) {
            res.json({"error":"please send all require attributes."});
        } else {
            // Verify address.
            // isValid.address(req.body.address + " " + req.body.city + ", " + req.body.province, r_address => {
            // Not working with Patrice's
            //var addressComponents = isValid.formatAddressComponents(r_address.address_components);
            var formatted_address = req.body.address + " " + req.body.city + ", " + req.body.province.toUpperCase() + ", " + req.body.postal;

            // Calculate distance with google map.
            var twoAddress = "7628 Flewellyn Rd Stittsville, ON, K2S 1B6|" + formatted_address;// r_address.formatted_address;
            var url = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + process.env.GOOGLE_MAP_TOKEN +
            '&' + qs.stringify({
                origins: twoAddress,
                destinations: twoAddress
            });
            request.custom("GET", url, {}, {}, distance => {
                var customDollarCar = 0;
                var customDollarSteel = 0;
                var customPercCar = 0;
                var customPercSteel = 0;
                if(req.user.roles == "admin") {
                    if(req.body.customDollarCar) {
                        customDollarCar = req.body.customDollarCar;
                    }
                    if(req.body.customDollarSteel) {
                        customDollarSteel = req.body.customDollarSteel;
                    }
                    if(req.body.customPercCar) {
                        customPercCar = req.body.customPercCar;
                    }
                    if(req.body.customPercSteel) {
                        customPercSteel = req.body.customPercSteel;
                    }
                }
                // Find or insert HeardOfUs.
                HeardOfUs.findOrCreate({
                    where: { type: req.body.heardOfUs },
                    defaults: { type: req.body.heardOfUs }
                }).spread((heardOfUs, created) => {
                    // Verify phone is unique
                    clients.findOrCreate({
                        where: { phone: req.body.phoneNumber },
                        defaults: {
                            idHeardOfUs: heardOfUs.id,
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            email: req.body.email,
                            type: req.body.type,
                            phone: req.body.phoneNumber,
                            extension: req.body.extension,
                            cellPhone: req.body.phoneNumber2,
                            secondaryPhone: req.body.phoneNumber3,
                            note: req.body.note,
                            grade: req.body.grade,
                            customDollarCar: customDollarCar,
                            customDollarSteel: customDollarSteel,
                            customPercCar: customPercCar,
                            customPercSteel: customPercSteel
                        }
                    }).spread((client, created) => {
                        if(created) {
                            console.log("---------------------------------------- distance")
                            console.log(distance);
                            address.create({
                                idClient: client.id,
                                // address: addressComponents.street_number + " " + addressComponents.route,
                                // city: addressComponents.locality,
                                // postal: addressComponents.postal_code,
                                // province: addressComponents.administrative_area_level_1,
                                address: req.body.address,
                                city: req.body.city,
                                postal: req.body.postal,
                                province: req.body.province.toUpperCase(),
                                distance: Number(distance.rows[0].elements[1].distance.value) + Number(distance.rows[1].elements[0].distance.value)
                            }).then(newAddress => {
                                client.address = newAddress;
                                if(req.body.company != "0") {
                                    business.create({
                                        id: client.id,
                                        name: req.body.name,
                                        description: req.body.description,
                                        contactPosition: req.body.contactPosition,
                                        pstTaxNo: req.body.pstTaxNo,
                                        gstTaxNo: req.body.gstTaxNo
                                    }).then(busi => {
                                        client.business = {};
                                        business.findById(req.body.id).then(comp => {
                                            client.business = comp;
                                            res.json(client);
                                        });
                                    });
                                } else {
                                    res.json(client);
                                }
                            });
                        } else {
                            res.json({"error":"Phone Number already exist."});
                        }
                    });
                  });
            });
        }
    })

    // get all customers with filter
    .get('/clients', [oauth], (req, res) => {
        var offset = 0;
        var filter = "%";
        if(typeof req.body.offset != 'undefined' && Number.isInteger(Number(req.body.offset))) {
            offset = Number(req.body.offset);
        }
        if(typeof req.query.filter != 'undefined') {
            filter = "%" + req.query.filter + "%";
        }
        clients.findAll({
            include: [{
                model: business,
                as: "business",
                include: [{
                    model: contact, as: "contacts"
                }]
            }, {
                model: HeardOfUs,
                as: "heardofus"
            }],
            where: {
                [Op.or]: [
                    {firstName: { [Op.like]: filter }},
                    {lastName: { [Op.like]: filter }},
                    {type: { [Op.like]: filter }},
                    {email: { [Op.like]: filter }},
                    {phone: { [Op.like]: filter }},
                    {extension: { [Op.like]: filter }},
                    {cellPhone: { [Op.like]: filter }},
                    {secondaryPhone: { [Op.like]: filter }},
                    {grade: { [Op.like]: filter }},
                    {note: { [Op.like]: filter }}
                ]
            },
            order: [
                ['firstName', 'ASC'],
                ['LastName', 'ASC']
            ],
            offset: offset,
            limit: 30
        })
        .then(function(lstClients) {
            var lst = [];
            async.each(lstClients, function(client, next) {
                address.findOne({
                    where: {
                        idClient: client.id
                    }
                }).then(addr => {
                    client.dataValues.address = addr;
                    lst.push(client);
                    next();
                });
            },function(){
                res.json(lst);
            });
        });
    })

    // get all phones number with filter.
    .get('/clients/phones', [oauth], (req, res) => {
        db.query(`SELECT
            idClient AS id,
            phone,
            cellPhone,
            secondaryPhone
        FROM Clients
        WHERE phone LIKE ?
        OR cellPhone LIKE ?
        OR secondaryPhone LIKE ?
        LIMIT ?
        OFFSET ?;`, {
            replacements: [req.query.search + "%", req.query.search + "%", req.query.search + "%", Number(req.query.limit), Number(req.query.offset) * Number(req.query.limit)],
            type: db.QueryTypes.SELECT
        }).then(phones => {
            res.json(phones);
        });
    })

    // get all addresses with postal filter.
    .get('/clients/:customerId/postal', [oauth], (req, res) => {
        db.query(`SELECT
            idAddress AS id,
            idClient,
            address,
            city,
            province,
            distance,
            postal
        FROM Address
        WHERE postal LIKE ? and idClient = ?;`, {
            replacements: ['%' + req.query.search + "%", Number(req.params.customerId)],
            type: db.QueryTypes.SELECT
        }).then(addresses => {
            res.json(addresses);
        });
    })

    //Get customer data from phone number.
    .get("/clients/phones/:phone", [oauth], (req, res) => {
        clients.findOne({
            where: {
                phone: req.params.phone
            },
            include: [{
                model: business,
                as: "business",
                include: [{
                    model: contact, as: "contacts"
                }]
            }, {
                model: HeardOfUs,
                as: "heardofus"
            }]
        }).then((client) => {
            if(!client) {
                res.json({"error": "Client not found!"});
            } else {
                address.findOne({
                    where: {
                        idClient: client.id
                    }
                }).then(adresse => {
                    client.dataValues.address = adresse;
                    res.json(client);
                });
            }
        });
    })

    // get one customer
    .get('/clients/:no', [oauth], (req, res) => {
        clients.findOne({
            where: { id: req.params.no },
            include: [{
                model: business,
                as: "business",
                include: [{
                    model: contact, as: "contacts"
                }]
            }, {
                model: HeardOfUs,
                as: "heardofus"
            }]
        }).then((client) => {
            if(!client) {
                res.json({"error": "Client not found!"});
            } else {
                address.findOne({
                    where: {
                        idClient: client.id
                    }
                }).then(adresse => {
                    client.dataValues.address = adresse;
                    res.json(client);
                });
            }
        });
    })

    // Update a customer.
    .patch('/clients/:no', [oauth], (req, res) => {
        //Validate body data before update.
        if(!req.body.firstName ||
           req.body.lastName == null ||
           req.body.email == null ||
           !req.body.type ||
           req.body.address == null ||
           req.body.city == null ||
           req.body.postal == null ||
           req.body.province == null ||
           !req.body.phoneNumber ||
           req.body.note == null ||
           req.body.grade == null ||
           !req.body.heardOfUs) {
            res.send('{"error":"please send all require attributes."}');
        } else if(req.body.type != "Individual" &&
                  (!req.body.name ||
                   req.body.description == null ||
                   !req.body.contactPosition ||
                   !req.body.pstTaxNo ||
                   !req.body.gstTaxNo)) {
            res.send('{"error":"please send all require attributes."}');
        } else {
            clients.findById(req.params.no).then(clientNote => {
                if(!clientNote) {
                    res.json({"error": "Customer not found!"});
                } else {
                    //Not admin can't edit previous notes. He can only add after.
                    if(req.user.roles != "admin"){
                        req.body.type = clientNote.type + "<br>" + req.body.type.replace(clientNote.type, "");;
                    }

                    var formatted_address = req.body.address + " " + req.body.city + ", " + req.body.province.toUpperCase() + ", " + req.body.postal;

                    //Calculate distance with google map.
                    var twoAddress = "7628 Flewellyn Rd Stittsville, ON, K2S 1B6|" + formatted_address;
                    var url = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + process.env.GOOGLE_MAP_TOKEN +
                    '&' + qs.stringify({
                        origins: twoAddress,
                        destinations: twoAddress
                    });

                    request.custom("GET", url, {}, {}, distance => {
                        var customDollarCar = 0;
                        var customDollarSteel = 0;
                        var customPercCar = 0;
                        var customPercSteel = 0;
                        if(req.user.roles == "admin") {
                            if(req.body.customDollarCar) {
                                customDollarCar = req.body.customDollarCar;
                            }
                            if(req.body.customDollarSteel) {
                                customDollarSteel = req.body.customDollarSteel;
                            }
                            if(req.body.customPercCar) {
                                customPercCar = req.body.customPercCar;
                            }
                            if(req.body.customPercSteel) {
                                customPercSteel = req.body.customPercSteel;
                            }
                        }
                        // Find or insert HeardOfUs.
                        HeardOfUs.findOrCreate({
                            where: { type: req.body.heardOfUs },
                            defaults: { type: req.body.heardOfUs }
                        }).spread((heardOfUs, created) => {
                            clients.update({
                                firstName: req.body.firstName,
                                lastName: req.body.lastName,
                                email: req.body.email,
                                type: req.body.type,
                                phone: req.body.phoneNumber,
                                extension: req.body.extension,
                                cellPhone: req.body.phoneNumber2,
                                secondaryPhone: req.body.phoneNumber3,
                                note: req.body.note,
                                grade: req.body.grade,
                                idHeardOfUs: heardOfUs.id,
                                customDollarCar: customDollarCar,
                                customDollarSteel: customDollarSteel,
                                customPercCar: customPercCar,
                                customPercSteel: customPercSteel
                            },
                            {
                                where: {id: req.params.no }
                            }).then((client) => {
                                address.upsert({
                                    idClient: req.params.no,
                                    address: req.body.address,
                                    city: req.body.city,
                                    postal: req.body.postal,
                                    province: req.body.province.toUpperCase(),
                                    // address: addressComponents.street_number + " " + addressComponents.route,
                                    // city: addressComponents.locality,
                                    // postal: addressComponents.postal_code,
                                    // province: addressComponents.administrative_area_level_1,
                                    distance: Number(distance.rows[0].elements[1].distance.value) + Number(distance.rows[1].elements[0].distance.value)
                                },{
                                    where: {
                                        idClient: req.params.no,
                                        address: req.body.address,
                                        city: req.body.city,
                                        postal: req.body.postal,
                                        province: req.body.province.toUpperCase(),
                                        // address: addressComponents.street_number + " " + addressComponents.route,
                                        // city: addressComponents.locality,
                                        // postal: addressComponents.postal_code,
                                        // province: addressComponents.administrative_area_level_1
                                    }
                                }).then(updatedAddress => {
                                    if(req.body.type != "Individual") {
                                        business.upsert({
                                            id: req.params.no,
                                            name: req.body.name,
                                            description: req.body.description,
                                            contactPosition: req.body.contactPosition,
                                            pstTaxNo: req.body.pstTaxNo,
                                            gstTaxNo: req.body.gstTaxNo
                                        }).then(busi => {
                                            clients.findById(req.params.no).then(updatedClient => {
                                                updatedClient.dataValues.business = busi.dataValues;
                                                updatedClient.dataValues.address = updatedAddress.dataValues;
                                                res.send(updatedClient);
                                            });
                                        });
                                    } else {
                                        contact.destroy({
                                            where: {
                                                idBusiness: req.params.no
                                            }
                                        }).then(r_ => {
                                            business.destroy({
                                                where: {
                                                    id: req.params.no
                                                }
                                            }).then((businessDestoyed) => {
                                                clients.findById(req.params.no).then(updatedClient => {
                                                    updatedClient.dataValues.address = updatedAddress.dataValues;
                                                    res.send(updatedClient);
                                                });
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    });
                }
            });
        }
    })

    .get("/clients/statistics/heardofus", [oauth], (req, res) => {
        clients.count({
            group: "Customer.idHeardOfUs",
            include: [{
                model: HeardOfUs, as: "heardofus"
            }],
            attributes: ["heardofus.type"]
        }).then(counters => {
            var lstData = [];
            var letters = '0123456789ABCDEF';
            var color = "";
            counters.forEach(counter => {
                color = "#";
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                lstData.push({
                    label: counter.type,
                    data: counter.count,
                    color: color
                })
            });
            res.json(lstData);
        });
    });
};
