var validator = require('validator');

exports.isValid = function(variableGiven, typeExpected){
    switch (typeExpected[0]) {
        case "text":
            switch (typeExpected[1]) {
                case "text":
                    return (typeof(variableGiven) == "string");

                case "email":
                    return validator.isEmail(variableGiven);

                case "url":
                    return validator.isURL(variableGiven);

                case "alpha":
                    return validator.isAlpha(variableGiven);

                case "alphanumeric":
                    return validator.isAlphanumeric(variableGiven);

                case "ascii":
                    return validator.isAscii(variableGiven);

                case "base64":
                    return validator.isBase64(variableGiven);

                case "creditcard":
                    return validator.isCreditCard(variableGiven);

                case "uuid":
                    return validator.isUUID(variableGiven);

                case "ip":
                    return validator.isIP(variableGiven);

                case "isbn":
                    return validator.isISBN(variableGiven);

                case "isin":
                    return validator.isISIN(variableGiven);

                case "iso8601":
                    return validator.isISO8601(variableGiven);

                default:
                    return false;
            }
            break;

        case "number":
            switch (typeExpected[1]) {
                case "decimal":
                    return validator.isDecimal(variableGiven);

                case "float":
                    return validator.isFloat(variableGiven);

                case "hexadecimal":
                    return validator.isHexadecimal(variableGiven);

                case "integer":
                    return (!isNaN(validator.toInt(variableGiven)));

                default:
                    return false;
            }
            break;

        case "date":
            return (validator.toDate(variableGiven) !== null);

        case "bool":
            return validator.isBoolean(variableGiven);

        case "json":
            if(typeof(variableGiven) == "string"){
                try {
                    JSON.parse(str);
                } catch (e) {
                    return false;
                }
                return true;
            }else{
                return typeof(variableGiven) == "object";
            }
            break;

        default:
            return false;
    }
};

exports.format = function(variableGiven, typeExpected){
    switch (typeExpected[0]) {
        case "text":
            return variableGiven;

        case "number":
            return Number(variableGiven);

        case "date":
            return new Date(variableGiven);

        case "bool":
            return Boolean(variableGiven);

        case "json":
            if(typeof(variableGiven) == "string"){
                return JSON.parse(variableGiven);
            }else{
                return variableGiven
            }

        default:
            return false;
    }
};
