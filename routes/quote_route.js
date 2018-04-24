var express = require('express');
var router = express.Router();
var db = require('../tools/db');
const Op = db.Op;
var users = require('../models/user');
var clients = require('../models/customer');
var HeardsOfUs = require('../models/heardofus');
var address = require('../models/address');
var status = require('../models/status');
var quotes = require('../models/quote');
var cars = require('../models/quotecar');
var async = require('async');
var moment = require('moment');
var request = require("../tools/request");

module.exports = function(app, oauth) {

  // Creates a blank quote
  app.post('/quotes', [oauth], (req, res) => {
    // Find the last settings
    // Copy them in the quote for now
    db.query("SELECT * FROM Settings WHERE dtCreated IN (SELECT MAX(dtCreated) FROM Settings GROUP BY name)", {
      type: db.QueryTypes.SELECT
    }).then(settings => {

      // The settings hash
      s = {};
      async.each(settings, function(setting) {
        s[setting.name] = setting.value;
      });

      quotes.count({
        where: {
          dtCreated: {
            [Op.gte]: moment().format("YYYY-MM-01 00:00:00")
          }
        }
      }).then(count => {
        var reference = moment().format("YYMM") + ("0000" + (count + 1)).slice(-4);
        quotes.create({
          idUser: req.user.idUser,
          reference: reference,
          smallCarPrice: s.smallCarPrice,
          midCarPrice: s.midCarPrice,
          largeCarPrice: s.largeCarPrice,
          steelPrice: s.steelPrice,
          wheelPrice: s.wheelPrice,
          catPrice: s.catalysorPrice,
          batteryPrice: s.batteryPrice,
          excessPrice: s.excessPrice,
          freeDistance: s.freeDistance,
          pickup: s.pickup
        }).then((quote) => {
          res.json(quote);
        });
      });
    });
  });

  // Creates a blank quote car
  app.post('/create-car', [oauth], (req, res) => {
    cars.create({
      idQuote: req.body.quote,
      idCar: req.body.veh,
      missingWheels: 0,
      missingBattery: null,
      missingCat: null,
      gettingMethod: "pickup",
    }).then(car => {
      res.json(car);
    });
  });

  // Creates a blank quote ca
  app.post('/remove-car', [oauth], (req, res) => {
    cars.destroy({
      where: {
        id: req.body.car
      }
    }).then(r_ => {
      res.json("{'msg':'ok'}");
    });
  });

  // Retrieves a quote car
  app.get('/quotecar/:carNo', [oauth], (req, res) => {
    cars.findById(req.params.carNo).then(car => {
      res.json(car);
    });
  });

    // get all quotes with filter.
  app.get("/quotes", [oauth], (req, res) => {
      var limit = 1000;
      var offset = 0;
      var where = {
        [Op.and]: []
      };
      if (typeof req.query.limit != 'undefined' && Number.isInteger(Number(req.query.limit)) && Number(req.query.limit) > 0) {
        limit = Number(req.query.limit);
      }
      if (typeof req.query.offset != 'undefined' && Number.isInteger(Number(req.query.offset)) && Number(req.query.offset) > 0) {
        offset = Number(req.query.offset) * limit;
      }
      if (typeof req.query.filter != 'undefined') {
        req.query.filter = "%" + req.query.filter.replace(/[\s]/g, "% %") + "%";
        var filters = req.query.filter.split(' ');
        var and = [];
        filters.forEach(fil => {
          and.push({
            [Op.or]: [{
                "$customer.firstName$": {
                  [Op.like]: fil
                }
              },
              {
                "$customer.lastName$": {
                  [Op.like]: fil
                }
              },
              {
                "$customer.phone$": {
                  [Op.like]: fil
                }
              },
              {
                "$customer.cellPhone$": {
                  [Op.like]: fil
                }
              },
              {
                "$customer.secondaryPhone$": {
                  [Op.like]: fil
                }
              },
              {
                note: {
                  [Op.like]: fil
                }
              },
              {
                referNo: {
                  [Op.like]: fil
                }
              },
              {
                "$dispatcher.firstName$": {
                  [Op.like]: fil
                }
              },
              {
                "$dispatcher.lastName$": {
                  [Op.like]: fil
                }
              },
              {
                "$status.name$": {
                  [Op.like]: fil
                }
              }
            ]
          });
        });
        where[Op.and] = and;
      }
      if (req.query.afterDate && req.query.afterDate.toString().length == 10 && moment(req.query.afterDate, "YYYY-MM-DD").isValid()) {
        where[Op.and].push({
          dtCreated: {
            [Op.gte]: req.query.afterDate + " 00:00:00"
          }
        });
      }
      if (req.query.beforeDate && req.query.beforeDate.toString().length == 10 && moment(req.query.beforeDate, "YYYY-MM-DD").isValid()) {
        where[Op.and].push({
          dtCreated: {
            [Op.lte]: req.query.beforeDate + " 23:59:59"
          }
        });
      }
      quotes.findAll({
        where: where,
        include: [{
            model: users,
            as: 'dispatcher'
          },
          {
            model: clients,
            as: 'customer'
          },
          {
            model: status,
            as: 'status'
          }
        ],
        limit: limit,
        offset: offset,
        order: [
          ["dtCreated", "DESC"]
        ]
      }).then(r_quotes => {
        res.json(r_quotes);
      });
    })

    // get one quote
    .get('/quotes/:no', [oauth], (req, res) => {
      quotes.findOne({
        where: {
          id: req.params.no
        },
        include: [{
            model: users,
            as: 'dispatcher'
          },
          {
            model: clients,
            as: 'customer',
            include: [{
              model: address,
              as: "address"
            }, {
              model: HeardsOfUs,
              as: "heardofus"
            }]
          },
          {
            model: status,
            as: 'status'
          }
        ]
      }).then((quote) => {
        if (!quote) {
          res.json({
            "error": "Quote not found!"
          });
        } else {
          cars.findAll({
            where: {
              idQuote: req.params.no
            },
            include: [{
              model: address,
              as: 'address'
            }]
          }).then(lst => {
            quote.dataValues.cars = lst;
            res.json(quote);
          });
        }
      });
    })

    // Update a quote.
    .patch('/quotes/:no', [oauth], (req, res) => {
      //Validate body data before update.
      if (!req.body.cars ||
        typeof req.body.note == 'undefined') {
        res.send('{"error":"please send all require attributes."}');
      } else {
        quotes.update({
          note: req.body.note
        }, {
          where: {
            id: req.params.no
          }
        }).then((quote) => {
          //Update all cars of quote.
          async.each(req.body.cars, function(car, next) {
            var gettingMethod = (typeof car.dropoff == 'undefined' ? "pickup" : "dropoff");
            if (typeof car.missingParts == 'undefined') {
              car.missingParts = "[]";
            }
            cars.update({
              missingParts: car.missingParts.toString(),
              donation: car.donation,
              gettingMethod: gettingMethod,
              flatBedTruckRequired: car.flatBedTruckRequired
            }, {
              where: {
                idCar: car.id,
                idQuote: req.params.no
              }
            }).then((vehicle) => {
              next();
            });
          }, function() {
            quotes.findById(req.params.no).then(updatedQuote => {
              if (!updatedQuote)
                res.json({
                  "error": "Quote not found!"
                });
              else
                res.json(updatedQuote);
            });
          });
        });
      }
    })

    //Update quote status.
    .patch('/quotes/:no/status', [oauth], (req, res) => {
      //Validate body data before update.
      if (!req.body.status) {
        res.json({
          "error": "please send attribute status."
        });
      } else {
        quotes.update({
          idStatus: req.body.status,
          dtStatusUpdated: db.fn("NOW")
        }, {
          where: {
            id: req.params.no
          },
          include: [{
            model: clients,
            as: "customer"
          }]
        }).then((results) => {
          quotes.findById(req.params.no, {
            include: [{
              model: clients,
              as: "customer"
            }]
          }).then(r_quote => {
            //If status is «in Yard», send sms to customer for know his appreciation.
            if (req.body.status == 6) {
              //Check if sms already sent.
              if (!r_quote.isSatisfactionSMSQuoteSent && r_quote.customer.cellPhone) {
                request.sendSMS(r_quote.customer.cellPhone, "Hello. This is CashForTrash. We recently bought your car. We want to know your satisfaction. On a scale of 1 to 10, how much did you appreciate our service? Please respond with a number.");
                quotes.update({
                  isSatisfactionSMSQuoteSent: 1
                }, {
                  where: {
                    id: req.params.no
                  }
                });
              }
            }
            res.json({
              "message": "Quote status updated!"
            });
          });
        });
      }
    })

    //delete a quote
    .delete('/quotes/:no', [oauth], (req, res) => {
      quotes.destroy({
        where: {
          id: req.params.no
        }
      }).then((results) => {
        res.json({
          "message": "Quote deleted!"
        });
      });
    })

    //Get all quotes of a particular customer.
    .get("/clients/:no/quotes", [oauth], (req, res) => {
      var offset = 0;
      var filter = "%";
      if (typeof req.body.offset != 'undefined' && Number.isInteger(Number(req.body.offset))) {
        offset = Number(req.body.offset);
      }
      if (typeof req.query.filter != 'undefined') {
        filter = "%" + req.query.filter + "%";
      }

      quotes.findAll({
          where: {
            idClient: req.params.no
          },
          include: [{
              model: users,
              as: 'dispatcher'
            },
            {
              model: clients,
              as: 'customer'
            },
            {
              model: status,
              as: 'status'
            }
          ],
          where: {
            [Op.or]: [{
              note: {
                [Op.like]: filter
              }
            }, {
              '$status.name$': {
                [Op.like]: filter
              }
            }, {
              '$dispatcher.firstName$': {
                [Op.like]: filter
              }
            }, {
              '$dispatcher.lastName$': {
                [Op.like]: filter
              }
            }, {
              reference: {
                [Op.like]: filter
              }
            }]
          },
          order: [
            ['dtCreated', 'DESC']
          ],
          offset: offset,
          limit: 30
        })
        .then(function(lstQuotes) {
          async.each(lstQuotes, function(quote, next) {
            //TODO! Format each quote before send it.
            next();
          }, function() {
            res.send(lstQuotes);
          });
        });
    })

    //Get all quotes made by particular user with filter.
    .get("/users/:no/quotes", [oauth], (req, res) => {
      var offset = 0;
      var filter = "%";
      if (typeof req.body.offset != 'undefined' && Number.isInteger(Number(req.body.offset))) {
        offset = Number(req.body.offset);
      }
      if (typeof req.query.filter != 'undefined') {
        filter = "%" + req.query.filter + "%";
      }

      quotes.findAll({
          where: {
            idUser: req.params.no,
            [Op.or]: [{
              '$customer.firstName$': {
                [Op.like]: filter
              }
            }, {
              '$customer.lastName$': {
                [Op.like]: filter
              }
            }, {
              '$customer.phone$': {
                [Op.like]: filter
              }
            }, {
              '$customer.extension$': {
                [Op.like]: filter
              }
            }, {
              '$customer.type$': {
                [Op.like]: filter
              }
            }, {
              '$customer.email$': {
                [Op.like]: filter
              }
            }, {
              '$customer.cellPhone$': {
                [Op.like]: filter
              }
            }, {
              '$customer.secondaryPhone$': {
                [Op.like]: filter
              }
            }, {
              '$customer.note$': {
                [Op.like]: filter
              }
            }, {
              '$customer.grade$': {
                [Op.like]: filter
              }
            }, {
              note: {
                [Op.like]: filter
              }
            }, {
              reference: {
                [Op.like]: filter
              }
            }, {
              '$status.name$': {
                [Op.like]: filter
              }
            }]
          },
          include: [{
              model: users,
              as: 'dispatcher'
            },
            {
              model: clients,
              as: 'customer'
            },
            {
              model: status,
              as: 'status'
            }
          ],
          order: [
            ['dtCreated', 'DESC']
          ],
          offset: offset,
          limit: 30
        })
        .then(function(lstQuotes) {
          async.each(lstQuotes, function(quote, next) {
            //TODO! Format each quote before send it.
            next();
          }, function() {
            res.send(lstQuotes);
          });
        });
    })

    //Get all possible status.
    .get("/status", [oauth], (req, res) => {
      status.findAll().then(list => {
        res.json(list);
      });
    });
};
