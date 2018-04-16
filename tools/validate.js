const request = require("./request");

module.exports = {
    address: function(item, callback) {
        request.custom("GET", "https://maps.googleapis.com/maps/api/geocode/json?key=" + process.env.GOOGLE_MAP_TOKEN + "&address="+item, {}, {contentType: "application/json"}, r_address => {
            if(r_address.results.length == 0) {
                callback(false);
            } else {
                callback(r_address.results[0]);
            }
        });
    },
    formatAddressComponents: function(address_components) {
        var returnedData = {};
        address_components.forEach(component => {
            returnedData[component.types[0]] = component.long_name;
        });
        return returnedData;
    },
    currency: function(expression, allowNegativeValue, callback) {
        if(!expression) {
            callback(false);
        } else {
            //Replace all «,» by «.» and remove all separator not used.
            expression = expression.replace(/,/g, ".");
            var count = (expression.match(/\./g) || []).length;
            for(var i = 0; i < count-1; i++) {
                expression = expression.replace(".", "");
            }

            //Validate currency.
            if(allowNegativeValue && /^-?\d+(\.\d{1,2})?$/.test(expression)) {
                //If not ending with «.00», add it manually.
                if(!/^\.\d$/.test(expression.substr(-2)) && !/^\.\d{2}$/.test(expression.substr(-3))) {
                    expression += ".00";
                } else if(/^\.\d$/.test(expression.substr(-2))) {
                    expression += "0";
                }
                callback(expression);
            } else if(!allowNegativeValue && /^\d+(\.\d{1,2})?$/.test(expression)) {
                //If not ending with «.00», add it manually.
                if(!/^\.\d$/.test(expression.substr(-2)) && !/^\.\d{2}$/.test(expression.substr(-3))) {
                    expression += ".00";
                } else if(/^\.\d$/.test(expression.substr(-2))) {
                    expression += "0";
                }
                callback(expression);
            } else {
                callback(false);
            }
        }
    },
    date: function(item) {
        if(item && item.toString().length == 10 && moment(item, "YYYY-MM-DD").isValid()) {
            return true;
        } else {
            return false;
        }
    },
    datetime: function(item) {
        if(item && item.toString().length == 19 && moment(item, "YYYY-MM-DD HH:mm:ss").isValid()) {
            return true;
        } else {
            return false;
        }
    },
    email: function(item) {
        if(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(item)) {
            return true;
        }
        return false;
    },
    integer: function(value) {
        if(/^[0-9]+$/.test(value)) {
            return true;
        }
        return false;
    },
    lang: function(item) {
        if(item === "en" || item === "fr") {
            return true;
        }
        return false;
    },
    name: function(item) {
        if(/^[a-zA-ZáàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ\s_-]+$/.test(item)) {
            return true;
        }
        return false;
    },
    password: function(item) {
        if(!item || item.length < 8) {
            return false;
        }
        if(/[A-Z]/.test(item) && /[a-z]/.test(item) && /\d/.test(item)) {
            return true;
        }
        return false;
    },
    phone: function(expression) {
        if(!expression) {
            return false;
        }
        var phone = "";
        for(var i = 0; i < expression.length; i++) {
            if(!isNaN(parseInt(expression[i]))) {
                phone += expression[i];
            }
        }
        if(phone.length < 10) {
            return false;
        } else if(phone.length == 10) {
            return phone.substr(0, 3) + " " + phone.substr(3, 3) + "-" + phone.substr(6);
        } else if(phone.length == 11) {
            return phone.substr(0, 1) + "-" + phone.substr(1, 3) + " " + phone.substr(4, 3) + "-" + phone.substr(7);
        } else {
            return phone;
        }
    },
    phoneDigitOnly: function(expression) {
        if(!expression) {
            return false;
        }
        var phone = "";
        for(var i = 0; i < expression.length; i++) {
            if(!isNaN(parseInt(expression[i]))) {
                phone += expression[i];
            }
        }
        if(phone.length < 10) {
            return false;
        } else {
            return phone;
        }
    },
    postal: function(expression) {
        //Validate postal code.
        if(!expression.match("^[a-zA-Z]{1}[0-9]{1}[a-zA-Z]{1}(\-| |){1}[0-9]{1}[a-zA-Z]{1}[0-9]{1}$")) {
            return "";
        } else {
            //Set toUpperCase all letters.
            expression = expression.toUpperCase();
            //Check if a space or special character separate in middle
            if(expression.length == 7) {
                //If yes, we remove this special character.
                expression = expression.substr(0,3) + expression.substr(4);
            }
            return expression;
        }
    },
    provinceAbbr: function(item) {
        var mapping = ["CDN", "AB", "BC", "MB", "NB", "NF", "NS", "ON", "PE", "QC", "SK", "NT", "NU", "YT", "USA", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "AS", "GU", "MP", "PR", "VI", "MEX", "AG", "BN", "BS", "CH", "CI", "CL", "CP", "CS", "DF", "DG", "GE", "GJ", "HD", "JA", "MC", "MR", "MX", "NA", "NL", "OA", "PU", "QE", "QI", "SI", "SL", "SO", "TA", "TB", "TL", "VC", "YU", "ZA", "OT"];
        if(mapping.find(key => { return key == item })) {
            return true;
        } else {
            return false;
        }
    },
    role: function(expression) {
        if(expression === "admin" || expression === "user") {
            return true;
        }
        return false;
    },
    time: function(item) {
        if(item && item.toString().length == 8 && moment(item, "HH:mm:ss").isValid()) {
            return true;
        } else {
            return false;
        }
    },
    username: function(item, callback) {
        if(/^[a-zA-Z0-9_.-]{6,}$/.test(item)) {
            callback(true);
        } else {
            callback(false);
        }
    }
}
