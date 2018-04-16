var express = require('express');
var router = express.Router();
var users = require('../models/user');
var hashers = require('node-django-hashers');
var async = require('async');
var hasher = new hashers.BCryptSHA256PasswordHasher();
var validate = require("../tools/validate");

module.exports = function(app, oauth) {

    //Create a user
    app.post('/users', [oauth], (req, res) => {
        //Validate if user asked this is a super admin.
        if(req.user.roles != "admin") {
            res.json({"error":"You are not a super admin."});
        }
        //Validate body data before insert.
        else if(req.body.firstName == null ||
           req.body.lastName == null ||
           req.body.email == null ||
           !req.body.pwd ||
           !req.body.username ||
           req.body.avatar == null ||
           req.body.roles == null ||
           !req.body.isSuperadmin) {
            res.json({"error":"please send all require attributes."});
        } else {
            if(req.body.phoneNumber == "") {
                delete req.body.phoneNumber;
            }
            //Verify username not exist.
            users.findOrCreate({
                where: {
                    username: req.body.username
                },
                defaults: {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    password: hasher.encode(req.body.pwd, hasher.salt()),
                    email: req.body.email,
                    roles: req.body.roles,
                    avatar: req.body.avatar,
                    phone: req.body.phoneNumber,
                    isSuperadmin: req.body.isSuperadmin
                }
            }).spread((user, created) => {
                if(created) {
                    res.send(user);
                } else {
                    res.send('{"error":"Username already exist."}');
                }
            });
        }
    })

    // get all users
    .get('/users', [oauth], (req, res) => {
        users.findAll()
        .then(function(lstUsers) {
            async.each(lstUsers, function(user, next) {
                if(user.phone == null) {
                    user.phone = "";
                }
                next();
            },function(){
                res.send(lstUsers);
            });
        });
    })

    // Find user by Id
    .get('/users/:no', [oauth], (req, res) => {
        users.findOne({
            where: { id: req.params.no }
        }).then((user) => {
            if(!user)
                res.send('{"error": "User not found!"}');
            else {
                if(user.phone == null) {
                    user.phone = "";
                }
                res.send(user);
            }
        });
    })

    // Update one user.
    .patch('/users/:no', [oauth], (req, res) => {
        if(req.user.roles != "admin" && req.user.idUser != req.params.no) {
            res.json({"error":"You are not authorize to update this user."});
        }
        //Validate body data before update.
        else if(req.body.firstName == null ||
           req.body.lastName == null ||
           !req.body.email ||
           !req.body.username ||
           req.body.roles == null) {
            res.json({"error":"Please send all require attributes."});
        } else {
            var phoneNumber = validate.phone(req.body.phoneNumber);
            if(req.body.phoneNumber != "" && phoneNumber === false) {
                res.status(400);
                res.json({"error":"phoneNumber must contain a valid phone number."});
            } else {
                if(req.body.phoneNumber == "") {
                    delete phoneNumber;
                }
                //Verify username not exist.
                users.findOne({ where: { username: req.body.username } }).then((userToValidate) => {
                    if(userToValidate && userToValidate.id != req.params.no) {
                        res.send('{"error":"Username already exist."}');
                    } else {
                        users.update({
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            email: req.body.email,
                            username: req.body.username,
                            phone: phoneNumber,
                            roles: req.body.roles
                        },
                        {
                            where: {id: req.params.no }
                        }).then((user) => {
                            //Update roles if user is an admin.
                            if(req.user.roles == "admin") {
                                users.update({
                                    roles: req.body.roles
                                },
                                {
                                    where: {id: req.params.no }
                                }).then((newRole) => {
                                    //Update password if it's there too.
                                    if(req.body.pwd != null) {
                                        users.update({
                                            password: hasher.encode(req.body.pwd, hasher.salt())
                                        },
                                        {
                                            where: {id: req.params.no }
                                        }).then(updatedUser => {
                                            users.findById(req.params.no).then(returnedUser => {
                                                if(!returnedUser)
                                                    res.json({"error": "User not found!"});
                                                else
                                                    res.send(returnedUser);
                                            });
                                        });
                                    } else {
                                        users.findById(req.params.no).then(returnedUser => {
                                            if(!returnedUser)
                                                res.json({"error": "User not found!"});
                                            else
                                                res.send(returnedUser);
                                        });
                                    }
                                });
                            } else {
                                //Update password if it's there too.
                                if(req.body.pwd != null) {
                                    users.update({
                                        password: hasher.encode(req.body.pwd, hasher.salt())
                                    },
                                    {
                                        where: {id: req.params.no }
                                    }).then(updatedUser => {
                                        users.findById(req.params.no).then(returnedUser => {
                                            if(!returnedUser)
                                                res.json({"error": "User not found!"});
                                            else
                                                res.send(returnedUser);
                                        });
                                    });
                                } else {
                                    users.findById(req.params.no).then(returnedUser => {
                                        if(!returnedUser)
                                            res.json({"error": "User not found!"});
                                        else
                                            res.send(returnedUser);
                                    });
                                }
                            }
                        });
                    }
                });
            }
        }
    })

	//Update avatar of specific user.
	.patch("/users/:no/avatar", [oauth], (req, res) => {
		if(req.user.roles != "admin" && req.user.idUser != req.params.no) {
            res.json({"error":"You are not authorize to update this user."});
        } else {
			if(req.body.avatar == null) {
				res.json({"error":"Please send all require attributes."})
			} else {
				users.update({
					avatar: req.body.avatar
				},
				{
					where: {id: req.params.no }
				}).then((user) => {
					users.findById(req.params.no).then(returned => {
						if(!returned) {
							res.json({"error":"User not found."})
						} else {
							res.json(returned);
						}
					})
				});
			}
		}
	})

    //Blacklist user
    .put("/users/:no", [oauth], (req, res) => {
        if(req.user.roles != "admin") {
            res.send('{"error":"You are not allowed to change state of this user."}');
        } else {
            users.findById(req.params.no).then(user => {
                if(user.isSuperadmin == "1") {
                    res.send('{"error":"You can not change state of a super admin."}');
                } else {
                    users.update({
                        isActive: req.body.isActive
                    },
                    {
                        where: {id: req.params.no }
                    }).then((updatedUser) => {
                        res.send('{"message":"User state has changed."}');
                    });
                }
            });
        }
    })

    //Remove a user
    .delete('/users/:no', [oauth], (req, res) => {
        if(req.user.isSuperadmin != 1) {
            res.send('{"error":"You are not a super admin."}');
        } else {
            users.destroy({
                where: {
                    id: req.params.no
                }
            }).then((results) => {
                res.send('{"message":"User deleted!"}');
            });
        }
    });
};
