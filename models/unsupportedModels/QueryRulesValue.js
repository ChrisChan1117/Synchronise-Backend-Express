/*var schema        = require(__dirname + '/../orm').schema;
var SHA256        = require("crypto-js/sha256");
var Promise       = require('promise');
var className     = "QueryRulesValue";
var primaryKey    = "objectId";

///// SCHEMA /////
var QueryRulesValue = schema.define(className, {
    objectId          : { type: schema.String, unique: true, index: true },
    createdAt         : { type: schema.Date,                 index: true },
    updatedAt         : { type: schema.Date,                 index: true },

    type              : { type: schema.String },
    valueConstant     : { type: schema.String }
}, {
    primaryKeys: [primaryKey]
});

///// RELATIONS /////
QueryRulesValue.belongsTo(DatabaseField,   {as: 'valueField',          foreignKey: primaryKey});
QueryRulesValue.belongsTo(QueryRulesGroup, {as: 'valueQueryRuleGroup', foreignKey: primaryKey});
QueryRulesValue.belongsTo(Query,           {as: 'valueQuery',          foreignKey: primaryKey});
QueryRulesValue.belongsTo(Query,           {as: 'query',               foreignKey: primaryKey});

///// RULES /////
QueryRulesValue.validatesPresenceOf('type');

///// EVENTS /////
QueryRulesValue.beforeCreate = function (next) {
    var newDate = new Date();
    this.createdAt = newDate;
    this.objectId = className+newDate.getTime();
    next();
};

QueryRulesValue.beforeSave = function(next){
    this.updatedAt = new Date();
    next();
};

QueryRulesValue.beforeUpdate = function(next){
    this.updatedAt = new Date();
    next();
}; 

///// METHODS /////

global.QueryRulesValue = schema.models.QueryRulesValue;*/