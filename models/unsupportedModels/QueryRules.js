/*var schema        = require(__dirname + '/../orm').schema;
var SHA256        = require("crypto-js/sha256");
var Promise       = require('promise');
var className     = "QueryRules";
var primaryKey    = "objectId";

///// SCHEMA /////
var QueryRules = schema.define(className, {
    objectId          : { type: schema.String, unique: true, index: true },
    createdAt         : { type: schema.Date,                 index: true },
    updatedAt         : { type: schema.Date,                 index: true },

    rule              : { type: schema.String }
}, {
    primaryKeys: [primaryKey]
});

///// RELATIONS /////
QueryRules.belongsTo(DatabaseField,   {as: 'field', foreignKey: primaryKey});
QueryRules.belongsTo(Query,           {as: 'query', foreignKey: primaryKey});

///// RULES /////
QueryRules.validatesPresenceOf('rule');

///// EVENTS /////
QueryRules.beforeCreate = function (next) {
    var newDate = new Date();
    this.createdAt = newDate;
    this.objectId = className+newDate.getTime();
    next();
};

QueryRules.beforeSave = function(next){
    this.updatedAt = new Date();
    next();
};

QueryRules.beforeUpdate = function(next){
    this.updatedAt = new Date();
    next();
}; 

///// METHODS /////

global.QueryRules = schema.models.QueryRules;*/