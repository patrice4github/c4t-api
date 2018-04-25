var express = require('express');
var router = express.Router();
var vehiclesinfo = require('../models/vehicleinfo');
var quote = require('../models/quote');
var cars = require('../models/quotecar');
var users = require('../models/user');
var status = require('../models/status');
var client = require('../models/customer');
var address = require('../models/address');
var isValid = require("../tools/validate");
var db = require('../tools/db');
const Op = db.Op;

module.exports = function(app, oauth) {

  // Returned all cars.
  // Can't do, for performance...
  app.get('/quotescars', [oauth], (req, res) => {
      cars.findAll({
          include: [{
              model: vehiclesinfo, as: 'information'
          }, {
              model: address, as: 'address'
          }, {
              model: quote, as: 'quote',
              include: [{
                  model: client, as: 'customer'
              }, {
                  model: users, as: 'dispatcher'
              }, {
                  model: status, as: 'status'
              }]
          }]
      }).then(lst => {
          res.json(lst);
      });
  })

  // Returned 1 car.
  // Can't do, for performance...
  app.get('/quotescar/:carNo', [oauth], (req, res) => {
      cars.findOne({
          where: {
              idQuoteCars: req.params.carNo
          },
          include: [{
              model: vehiclesinfo, as: 'information'
          }, {
              model: address, as: 'address'
          }, {
              model: quote, as: 'quote',
              include: [{
                  model: client, as: 'customer'
              }, {
                  model: users, as: 'dispatcher'
              }, {
                  model: status, as: 'status'
              }]
          }]
      }).then(car => {
          res.json(car);
      });
  })

  .get('/quotes/:quoteNo/cars', [oauth], (req, res) => {
      cars.findAll({
          where: {
              idQuote: req.params.quoteNo
          },
          include: [{
              model: vehiclesinfo, as: 'information'
          }, {
              model: address, as: 'address'
          }, {
              model: quote, as: 'quote',
              include: [{
                  model: client, as: 'customer'
              }, {
                  model: users, as: 'dispatcher'
              }, {
                  model: status, as: 'status'
              }]
      }]}).then(cars => {
          res.json(cars);
      });
  })
}
