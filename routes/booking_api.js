var cars = require('../models/quotecar');

module.exports = function(app, oauth) {
  // Saves the booking
  app.post('/booking', [oauth], (req, res) => {
    Object.keys(req.body).forEach(function(key) {
      // Find the car params, then the car ids
      // Use the vin to identify the quoteCar.idQuoteCars
      // The param is will look like: vin-123
      if (key.startsWith('vin')) {
        // We have found a car id!
        var carId = key.split('-')[1];
        console.log("=======> Saving booking for carId: " + carId)
        date  = (req.body["dateBooked-" + carId] == '' ? null : req.body["dateBooked-" + carId]);
        cash  = (req.body["cashRegular-" + carId] == '' ? null : req.body["cashRegular-" + carId]);
        comp  = (req.body["complete-" + carId] == null ? null : (req.body["complete-" + carId] == '1'));
        runn  = (req.body["running-" + carId] == null ? null : (req.body["running-" + carId] == '1'));
        own   = (req.body["ownership-" + carId] == null ? null : (req.body["ownership-" + carId] == '1'));
        keys  = (req.body["gotKeys-" + carId] == null ? null : (req.body["gotKeys-" + carId] == '1'));
        tow   = (req.body["isTowable-" + carId] == null ? null : (req.body["isTowable-" + carId] == '1'));
        twowd = (req.body["canDo2wd-" + carId] == null ? null : (req.body["canDo2wd-" + carId] == '1'));
        neut  = (req.body["canGoNeutral-" + carId] == null ? null : (req.body["canGoNeutral-" + carId] == '1'));
        cars.update({
          gotKeys: keys,
          drivetrain: req.body["drivetrain-" + carId],
          tiresCondition: req.body["tiresCondition-" + carId],
          ownership: own,
          running: runn,
          complete: comp,
          isTowable: tow,
          canDo2wd: twowd,
          canGoNeutral: neut,
          color: req.body["color-" + carId],
          receipt: req.body["receipt-" + carId],
          vin: req.body["vin-" + carId],
          ownershipName: req.body["ownershipName-" + carId],
          ownershipAddress: req.body["ownershipAddress-" + carId],
          cashRegular: cash,
          timeBooked: req.body["timeBooked-" + carId],
          dateBooked: date,
          carNotes: req.body["carNotes-" + carId],
          driverNotes: req.body["driverNotes-" + carId]
        }, {
          where: {
            idQuoteCars: carId
          }
        });
      }
    });

    res.json({
      "message": "Booking saved"
    });
  })
}
