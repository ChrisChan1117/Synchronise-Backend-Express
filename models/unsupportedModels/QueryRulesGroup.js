/*var schema        = require(__dirname + '/../orm').schema;
var SHA256        = require("crypto-js/sha256");
var Promise       = require('promise');
var className     = "QueryRulesGroup";
var primaryKey    = "objectId";

///// SCHEMA /////
var QueryRulesGroup = schema.define(className, {
    objectId          : { type: schema.String, unique: true, index: true },
    createdAt         : { type: schema.Date,                 index: true },
    updatedAt         : { type: schema.Date,                 index: true },
    
    andOrValue        : { type: schema.String }
}, {
    primaryKeys: [primaryKey]
});

///// RELATIONS /////
QueryRulesGroup.belongsTo(Query,      {as: 'query',  foreignKey: primaryKey});
QueryRulesGroup.belongsTo(QueryRules, {as: 'parent', foreignKey: primaryKey});

QueryRulesGroup.hasMany(QueryRules,   {as: 'rules',  foreignKey: primaryKey});

///// RULES /////
QueryRulesGroup.validatesPresenceOf('andOrValue');

///// EVENTS /////
QueryRulesGroup.beforeCreate = function (next) {
    var newDate = new Date();
    this.createdAt = newDate;
    this.objectId = className+newDate.getTime();
    next();
};

QueryRulesGroup.beforeSave = function(next){
    this.updatedAt = new Date();
    next();
};

QueryRulesGroup.beforeUpdate = function(next){
    this.updatedAt = new Date();
    next();
}; 

///// METHODS /////

global.QueryRulesGroup = schema.models.QueryRulesGroup;*/