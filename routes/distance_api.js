var qs = require("querystring");
var request = require("../tools/request");
var async = require('async');

module.exports = function(app, oauth) {

  function getDistance(origin, destination, res) {
    var url = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + process.env.GOOGLE_MAP_TOKEN +
    '&' + qs.stringify({
        origins: origin,
        destinations: destination
    });
    request.custom("GET", url, {}, {}, distance => {
      res.json(distance);
    });
  }

  // Calculate distance with google api to the yard
  app.get('/distance/:postal', [oauth], (req, res) => {
    var origin = "7628 Flewellyn Rd Stittsville, ON, K2S1B6";
    var destination = req.params.postal + " Canada";
    getDistance(origin, destination, res);
    /*
    var url = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + process.env.GOOGLE_MAP_TOKEN +
    '&' + qs.stringify({
        // origins: twoAddress,
        // destinations: twoAddress
        origins: origin,
        destinations: destination
    });
    request.custom("GET", url, {}, {}, distance => {
      res.json(distance);
    });
    */
  });

  app.post('/distancediff', [oauth], (req, res) => {
    var origin      = req.body.origin;
    var destination = req.body.destination;
    getDistance(origin, destination, res);
    /*
    var url = "https://maps.googleapis.com/maps/api/distancematrix/json?key=" + process.env.GOOGLE_MAP_TOKEN +
    '&' + qs.stringify({
        // origins: twoAddress,
        // destinations: twoAddress
        origins: origin,
        destinations: destination
    });
    request.custom("GET", url, {}, {}, distance => {
      res.json(distance);
    });
    */
  });
}

// From the doc
// https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=Washington,DC&destinations=New+York+City,NY&key=YOUR_API_KEY