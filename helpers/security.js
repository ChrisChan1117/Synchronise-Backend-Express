var path          = require('path');
var crypto        = require('crypto');
var node_cryptojs = require(path.normalize(__dirname + '/../libraries/security/cryptojs'));
var JsonFormatter = node_cryptojs.JsonFormatter;
var CryptoJS      = node_cryptojs.CryptoJS;
var Promise       = require('promise');

function passwordIsCorrect(password, passwordMatcher){
    var decrypted = CryptoJS.AES.decrypt(passwordMatcher, password.toString("base64"), {
        format: JsonFormatter
    });

    var decrypted_str = CryptoJS.enc.Utf8.stringify(decrypted);
    return(decrypted_str == "ok");
};

exports.passwordIsCorrect = passwordIsCorrect;

exports.encrypt = function(stringToEncrypt, encryptionPhrase){
    var encrypted = CryptoJS.AES.encrypt(stringToEncrypt, encryptionPhrase, {
        format: JsonFormatter
    });

    return encrypted.toString();
};

exports.decrypt = function(stringToDecrypt, encryptionPhrase){
    var objectToDecrypt;
    if(typeof(stringToDecrypt) == "string"){
        objectToDecrypt = JSON.parse(stringToDecrypt);
    }else{
        objectToDecrypt = stringToDecrypt;
    }

    var decrypted = CryptoJS.AES.decrypt(objectToDecrypt, encryptionPhrase.toString("base64"), {
        format: JsonFormatter
    });

    return CryptoJS.enc.Utf8.stringify(decrypted);
};
