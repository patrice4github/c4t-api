const Quote = require("../models/quote");
const QuoteCar = require("../models/quotecar");
const HeardOfUs = require("../models/heardofus");
const User = require("../models/user");
const Client = require("../models/customer");
const Address = require("../models/address");
const Validate = require("../tools/validate");
var moment = require("moment");
const db = require("../tools/db");
const Op = db.Op;
const async = require("async");

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
};

const findAddress = asyncMiddleware(async(client, car) => {
});

module.exports = function(app, oauth) {

  // The save a of a quote
  app.post("/quickquotes", [oauth], asyncMiddleware(async (req, res) => {

      //Validate body data before insert.
      if (req.body.firstName == null ||
        req.body.lastName == null ||
        req.body.postal == null ||
        !req.body.heardofus ||
        req.body.phone == null) {
        res.status(400);
        res.json({
          "error": "Please send all require attributes."
        });
      } else {
        req.body.postal = Validate.postal(req.body.postal);
        if (req.body.postal.length < 6 || req.body.postal > 7) {
          res.status(400);
          res.json({
            "error": "The postal code seems invalid."
          });
          return;
        }

        // Parse validate the phone number
        var phone = "";
        for (var i = 0; i < req.body.phone.length; i++) {
          if (!isNaN(parseInt(req.body.phone[i]))) {
            phone += req.body.phone[i];
          }
        }
        if (phone.length < 10) {
          res.status(400);
          res.json({
            "error": "phone number length must be at least 10 digits."
          });
          return;
        }

        // Parse the cars
        var carList = null;
        try {
          carList = JSON.parse(req.body.cars);
        } catch (e) {
          res.json({
            "error": "The cars cannot be parsed"
          });
        }
        if (carList == undefined || carList.length == 0 || !carList[0].gettingMethod) {
          res.status(400);
          res.json({
            "error": "List of cars is empty. Cannot save quote."
          });
        } else {
          // Find or create heardOfUs.
          HeardOfUs.findOrCreate({
            where: {
              type: req.body.heardofus
            },
            defaults: {
              type: req.body.heardofus
            }
          }).spread((heardOfUs, created) => {
            Client.customUpsert({
              defaults: {
                idHeardOfUs: heardOfUs.id,
                phone: phone,
                firstName: req.body.firstName,
                lastName: req.body.lastName
              },
              where: {
                phone: phone
              }
            }, (created, client) => {
              Quote.count({
                where: {
                  dtCreated: {
                    [Op.gte]: moment().format("YYYY-MM-DD") + " 00:00:00"
                  }
                }
              }).then(counter => {
                Quote.customUpsert({
                  oncreate: {
                    reference: moment().format("YYMM") + (Number(counter) + 1).toString().padStart(4, "0"),
                    note: ""
                  },
                  defaults: {
                    idUser: req.user.idUser,
                    idClient: client.id
                  },
                  where: {
                    id: req.body.quote
                  }
                }, (created, quote) => {

                  // Address.findOrCreate({
                  //   defaults: {
                  //     idClient: client.id,
                  //     address: "",
                  //     city: "",
                  //     postal: req.body.postal,
                  //     province: "",
                  //     distance: 0
                  //   },
                  //   where: {
                  //     idClient: client.id,
                  //     postal: req.body.postal
                  //   }
                  // }).spread((address, created) => {

                    async.each(carList, (car, next) => {
                      // console.log("2--------- car: " + car)
                      // var address = findAddress(client, car);
                      // console.log("6--------- address id: " + address.id)

                      // Talk about code duplication which I can't remove...
                      if (car.carAddressId && car.carAddressId != "0") {
                          // ALERT: code duplication
                          QuoteCar.update(
                            {
                              idAddress: parseInt(car.carAddressId),
                              missingWheels: car.missingWheels ? parseInt(car.missingWheels) : 0,
                              missingBattery: (car.missingBattery && car.missingBattery == 1),
                              missingCat: (car.missingCat && car.missingCat == 1),
                              gettingMethod: car.gettingMethod,
                              flatBedTruckRequired: false  // Not needed yet
                            },
                            {
                              where: {id: car.car}
                            }
                          ).spread((affectedCount, affectedRows) => {
                            next();
                          });
                      } else if (car.carAddressId && car.carAddressId == "0" && car.carPostal){
                        Address.findOrCreate({
                          defaults: {
                            idClient: client.id,
                            address: "",
                            city: "",
                            postal: car.carPostal,
                            province: "",
                            distance: 0
                          },
                          where: {
                            idClient: client.id,
                            postal: car.carPostal
                          }
                        }).spread((address, created) => {
                          // ALERT: code duplication
                          QuoteCar.update(
                            {
                              idAddress: address.id,
                              missingWheels: car.missingWheels ? parseInt(car.missingWheels) : 0,
                              missingBattery: (car.missingBattery && car.missingBattery == 1),
                              missingCat: (car.missingCat && car.missingCat == 1),
                              gettingMethod: car.gettingMethod,
                              flatBedTruckRequired: false  // Not needed yet
                            },
                            {
                              where: {id: car.car}
                            }
                          ).spread((affectedCount, affectedRows) => {
                            next();
                          });
                        });

                      } else {
                        console.log("Neither carAddressId nor addressPostal can be found");
                        next();
                      }

                    }, function() {
                      Quote.findById(quote.id, {
                        include: [{
                          model: QuoteCar,
                          as: "cars"
                        }, {
                          model: Client,
                          as: "customer"
                        }]
                      }).then(r_quote => {
                        res.json(r_quote);
                      });
                    });
                  // });
                });
              });
            });
          });
        }
      }
    }))

    .get("/quickquotes", [oauth], (req, res) => {
      QuickQuote.findAll({
        include: [{
          model: User,
          as: "dispatcher"
        }, {
          model: HeardOfUs,
          as: "heardofus"
        }]
      }).then(quickquotes => {
        res.json(quickquotes);
      });
    })
}
