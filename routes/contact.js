var express = require('express');
var router = express.Router();
var Business = require('../models/business');
var Contact = require('../models/contact');
var db = require('../tools/db');
const Op = db.Op;
var async = require("async");

module.exports = function(app, oauth) {
    //Update contacts list.
    app.post("/clients/:no/contact", [oauth], (req, res) => {
        //Verify customer exist.
        Business.findById(req.params.no).then(customer => {
            if(!customer) {
                res.status(404);
                res.json({"error":"Client not found or not a business."});
            } else {
                // Empty contacts list.
   
                    if(req.body.contacts == undefined) {
                        res.status(400);
                        hasError = true;
                        res.json({"error":"Contact Can not be deleted"});
                        return false;
                    } else {
                        // Validate data body.
                        var hasError = false;
                        req.body.contacts.forEach(contact => {
                            if(!hasError &&
                            (!contact.firstName ||
                            !contact.lastName ||
                            !contact.paymentMethod)) {
                                res.status(400);
                                res.json({"error":"Please send all require attributes."});
                                hasError = true;
                            }
                        });
                        if(hasError) {
                            return;
                        }
                        // Add updated list.
                        async.each(req.body.contacts, (contact, next) => {
                            
                            if(contact.idContact==''){
                            Contact.create({
                                idBusiness: req.params.no,
                                firstName: contact.firstName,
                                lastName: contact.lastName,
                                paymentMethod: contact.paymentMethod
                            }).then(r_ => {
                                next();
                            });
                        }else{
                             Contact.update({
                                    idContact: contact.idContact,
                                    idBusiness: req.params.no,
                                    firstName: contact.firstName,
                                    lastName: contact.lastName,
                                    paymentMethod: contact.paymentMethod
                            },{
                                where: {
                                    idContact: contact.idContact
                                }
                            }).then(r_ => {
                                next();
                            });
                            }
                        }, function() {
                            Business.findById(req.params.no, {
                                include: [{
                                    model: Contact, as: "contacts"
                                }]
                            }).then(business => {
                                res.json(business);
                            });
                        });
                    }
              
            }
        });
    })
}
