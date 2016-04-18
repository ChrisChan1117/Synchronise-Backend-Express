var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('databasefield', {
        tableSetId     : { type: "text" },
        name           : { type: "text" },
        usageFrequency : { type: "text", defaultValue: 1},
        type           : ["boolean", "data", "date", "number", "string", "unknown"],
        nativeType     : { type: "text" }
    }, {
        timestamp   : true,
        validations : {
            name : orm.enforce.required("You need to provide a name for that database table set")
        },
        indexes : {
            name           : redis.index.discrete,
            usageFrequency : redis.index.discrete,
            tableSetId     : redis.index.discrete
        }
    });

    global.DatabaseField = db.models.databasefield;

    // Creates one new field
    DatabaseField.createField = function(tableId, name, type, nativeType){
        return new Promise(function(resolve, reject){
            DatabaseField.create({
                tableSetId : tableId,
                name       : name,
                type       : type,
                nativeType : nativeType
            }, function(err, field){
                if(!err){
                    resolve(field);
                }else{
                    reject(err);
                }
            });
        });
    };

    // Returns all of the field of a table
    DatabaseField.fieldsForTable = function(tableSetId){
        return new Promise(function(resolve, reject){
            DatabaseField.find({tableSetId: tableSetId}, function(err, results){
                if(err){
                    reject(err);
                }else{
                    resolve(results);
                }
            });
        });
    };

    // Returns one field with its ID
    DatabaseField.field_with_id = function(id){
        return new Promise(function(resolve, reject){
            DatabaseField.one({id: id}, function(err, result){
                if(err){
                    reject(err);
                }else{
                    resolve(result);
                }
            });
        });
    };

    // Returns a field in a specific table with only its name
    DatabaseField.fieldInTableWithName = function(id_table, name){
        return new Promise(function(resolve, reject){
            DatabaseField.one({tableSetId: id_table, name: name}, function(err, field){
                if(!err){ resolve(field); }else{ reject(err); }
            });
        });
    };

    DatabaseField.removeWithID = function(id){
        return new Promise(function(resolve, reject){
            DatabaseField.one({id: id}, function(err, field){
                if(err){ reject(); }else{
                    if(!field){ reject(); }else{
                        field.remove(function(err){
                            if(err){ reject(err); }else{ resolve(); }
                        });
                    }
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
