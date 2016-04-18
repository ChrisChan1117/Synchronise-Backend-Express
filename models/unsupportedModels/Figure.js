var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('figure', {

    }, {
        timestamp   : true,
        validations : {},
        indexes : {}
    });

    global.Figure = db.models.figure;

    Figure.figuresForUser = function(user){
        return new Promise(function(resolve, reject){
            Figure.find({ user_id: user.get('id') }, function(err, results){
              if(!err){
                  resolve(objectFormatter.format(results));
              }else{
                  reject(err);
              }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};

/*var schema          = require(__dirname + '/../orm').schema;
var objectFormatter = require(__dirname + '/../helpers/objectFormatter');
var SHA256          = require("crypto-js/sha256");
var Promise         = require('promise');
var className       = "Figure";
var primaryKey      = "objectId";

///// SCHEMA /////
var Figure = schema.define(className, {
    objectId          : { type: schema.String, unique: true, index: true },
    createdAt         : { type: schema.Date,                 index: true },
    updatedAt         : { type: schema.Date,                 index: true }
}, {
    primaryKeys: [primaryKey]
});

///// RELATIONS /////

///// RULES /////

///// EVENTS /////
Figure.beforeCreate = function (next) {
    var newDate = new Date();
    this.createdAt = newDate;
    this.objectId = className+newDate.getTime();
    next();
};

Figure.beforeSave = function(next){
    this.updatedAt = new Date();
    next();
};

Figure.beforeUpdate = function(next){
    this.updatedAt = new Date();
    next();
};

///// METHODS /////
Figure.figuresForUser = function(user){
    return new Promise(function(resolve, reject){
        var query = Figure.find();
            query.where(primaryKey, user.get("id"));
            query.run({}, function(err, figures){
                if(!err){
                    resolve(objectFormatter.format(figures));
                }else{
                    reject(err);
                }
            });
    });
};

global.Figure = schema.models.Figure;*/
