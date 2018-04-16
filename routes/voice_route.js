var express = require('express');
var router = express.Router();
var request = require("../tools/request");
var Schedule = require("../models/schedule");
var Car = require("../models/quotecar");
var Quote = require("../models/quote");
var Client = require("../models/customer");
const Voice = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const VoiceResponse = require('twilio').twiml.VoiceResponse;
var Cron = require('cron').CronJob;
var moment = require("moment");
var db = require("../tools/db");
var Op = db.Op;

module.exports = function(app, oauth) {

    new Cron('00 */5 * * * *', function() {
        //Get all schedule of this time.
        Schedule.findAll({
            where: {
                dtStart: moment().add(1, "hour").format("YYYY-MM-DD HH:mm:00")
            },
            include: [{
                model: Car, as: "car",
                include: [{
                    model: Quote, as: "quote",
                    include: [{
                        model: Client, as: "customer"
                    }]
                }]
            }]
        }).then(schedules => {
            if(schedules.length > 0) {
                //Distinct customers.
                var r_clients = [];
                schedules.forEach(r_schedule => {
                    if(r_clients.find(r_client => {
                        return r_client.id == r_schedule.car.quote.customer.id
                    }) == undefined) {
                        r_clients.push(r_schedule.car.quote.customer);
                    }
                });
                //Call them and avise them that C4T will arrive soon.
                r_clients.forEach(r_client => {
                    Voice.calls.create({
                        to: r_client.phone,
                        from: process.env.TWILIO_PHONE_NO,
                        url: "http://admin.cashfortrashcanada.com:8181/voice/commingsoon"
                    }).catch(error => {
                        console.error(error);
                    })
                });
            }
        });
    }, null, true, process.env.TZ);

    app.post("/voice/commingsoon", (req, res) => {
        const twiml = new VoiceResponse();
        twiml.pause({
            length: 2
        });
        twiml.say({
            voice: 'alice'
        }, 'Hello. This is Cash For Trash. We want to inform you that we will be at your home in 60 minutes. Thanks to you and see you soon.');
        twiml.hangup();

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    })
}
