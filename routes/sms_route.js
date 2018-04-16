var express = require('express');
var router = express.Router();
var request = require("../tools/request");
var client = require("../models/customer");
var satisfaction = require("../models/satisfaction");
var db = require("../tools/db");
var Op = db.Op;

module.exports = function(app, oauth) {

    //Customer respond sms from appreciation service quote.
    app.post("/sms/appreciations", (req, res) => {
        if(!req.body.From || !req.body.Body) {
            res.setHeader("Content-Type", "text/plain");
            res.status(400);
            res.send("You do not have authorization.");
        } else {
            var from = req.body.From.substr(2, 10);
            var note = req.body.Body;
            //Search client by phoneNumber.
            client.findOne({
                where: {
                    [Op.or]: [{
                        phone: from
                    }, {
                        cellPhone: from
                    }, {
                        secondaryPhone: from
                    }]
                }
            }).then(r_client => {
                //Check note value.
                if(!r_client || !/^\d+$/.test(note) || note <= 0 || note > 10) {
                    res.setHeader("Content-Type", "text/plain");
                    res.status(400);
                    res.send("You do not have authorization.");
                } else {
                    //Save satisfaction.
                    satisfaction.create({
                        idClient: r_client.id,
                        from: from,
                        satisfaction: note
                    }).then(r_ => {
                        res.setHeader("Content-Type", "text/plain");
                        res.send("Thank you!");
                    });
                }
            });
        }
    })

    //TEST Send SMS
    .get('/sms', [oauth], (req, res) => {
        request.sendSMS("4388241370", "This is a test");
        res.send("ok");
    })
}
