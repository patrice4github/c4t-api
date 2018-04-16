var request = require('request');
var headerToken = {
    "Content-Type":"application/x-www-form-urlencoded"
};
module.exports = {
    get: function(link, callback) {
        request({
            url: "http://localhost:" + process.env.PORT_API + link,
            method: "GET",
            headers: headerToken
        }, (error, response, body) => {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback(error);
            }
        });
    },
    post: function(link, bodyData, callback) {
        request({
            url: "http://localhost:" + process.env.PORT_API + link,
            method: "POST",
            headers: headerToken,
            form: bodyData
        }, (error, response, body) => {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback(error);
            }
        });
    },
    put: function(link, bodyData, callback) {
        request({
            url: "http://localhost:" + process.env.PORT_API + link,
            method: "PUT",
            headers: headerToken,
            form: bodyData
        }, (error, response, body) => {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback(error);
            }
        });
    },
    patch: function(link, bodyData, callback) {
        request({
            url: "http://localhost:" + process.env.PORT_API + link,
            method: "PATCH",
            headers: headerToken,
            form: bodyData
        }, (error, response, body) => {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback(error);
            }
        });
    },
    delete: function(link, callback) {
        request({
            url: "http://localhost:" + process.env.PORT_API + link,
            method: "DELETE",
            headers: headerToken
        }, (error, response, body) => {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback(error);
            }
        });
    },
    saveToken: function(token) {
        headerToken.Authorization = "Bearer " + token;
    },
    custom: function(method, url, bodyData, headers, callback) {
        request({
            url: url,
            method: method,
            headers: headers,
            form: bodyData
        }, (error, response, body) => {
            if (!error) {
                callback(JSON.parse(body));
            } else {
                callback(error);
            }
        });
    },
    sendSMS: function(to, message) {
        require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        .messages.create({
            to: to,
            from: process.env.TWILIO_PHONE_NO,
            body: message,
        }).catch(error => {
            console.error(error);
        })
    }
}
