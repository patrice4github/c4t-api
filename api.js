// loads environment variables
require('dotenv').config();
process.env.TZ = 'America/Toronto';

var users = require('./models/user');
var customers = require('./models/customer');
var quotes = require('./models/quote');
var vehiclesinfo = require('./models/vehicleinfo');

// basic requires
var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require('body-parser');
var oauth = require('./tools/authentification');

// enables bodyParser to read data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require('./routes/distance_route')(app, oauth);
require('./routes/login_route')(app, oauth);
require('./routes/sms_route')(app, oauth);
require('./routes/voice_route')(app, oauth);
require('./routes/user_route')(app, oauth);
require('./routes/setting_route')(app, oauth);
require('./routes/charity_route')(app, oauth);
require('./routes/heardofus')(app, oauth);
require('./routes/address_route')(app, oauth);
require('./routes/contact')(app, oauth);
require('./routes/customer_route')(app, oauth);
require('./routes/vehicle_route')(app, oauth);
require('./routes/quote_route')(app, oauth);
require('./routes/quickquote')(app, oauth);
require('./routes/schedule_route')(app, oauth);

// starts the app
app.listen(process.env.PORT, process.env.HOST);
module.exports = app;
