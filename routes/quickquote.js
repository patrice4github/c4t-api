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

module.exports = function(app, oauth) {

  function updateCarForAddress(car, client, next) {

    // If the addressId is an int, it's an addressId, else it's a postal
    var addressId = parseInt(car.carAddressId);

    if (!isNaN(addressId)) {
      // It's a number
      updateQuoteCar(car, addressId, next);

    } else {
      console.log("Creating a new address with postal: " + car.carPostal);
      // We can create a new address
      Address.create(
        {
          idClient: client.id,
          address: "",
          city: "",
          postal: car.carPostal,
          province: "",
          distance: 0
      }).then((created) => {
        updateQuoteCar(car, created.id, next);
      });
    }
  }

  // The update of a quote car
  function updateQuoteCar(car, addressId, next) {

    QuoteCar.update(
      {
        idAddress: parseInt(car.carAddressId),
        missingWheels: car.missingWheels ? parseInt(car.missingWheels) : 0,
        missingBattery: (car.missingBattery && car.missingBattery == 1),
        missingCat: (car.missingCat && car.missingCat == 1),
        gettingMethod: car.gettingMethod,
        distance: (car.distance ? parseFloat(car.distance) : null),
      },
      {
        where: {id: car.car}
      }
    ).spread((affectedCount, affectedRows) => {
      next();
    });
  }

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

                  // Save each car
                  async.each(carList, (car, next) => {

                    updateCarForAddress(car, client, next);

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
