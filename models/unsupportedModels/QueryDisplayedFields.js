var path            = require("path");
var redis           = require('node-orm2-redis');
var Promise         = require('promise');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));

module.exports = function (db, cb) {
    db.define('querydisplayedfields', {
        query_id          : { type: "text"},
        field_id          : { type: "text"}
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            query_id: redis.index.discrete,
            field_id: redis.index.discrete
        }
    });

    global.QueryDisplayedFields = db.models.querydisplayedfields;

    QueryDisplayedFields.displayedFieldsForQuery = function(query_id){
        return new Promise(function(resolve, reject){
            QueryDisplayedFields.find({ query_id: query_id }, function(err, results){
                if(!err){
                    resolve(objectFormatter.format(results));
                }else{
                    reject(err);
                }
            });
        });
    };

    QueryDisplayedFields.displayedFieldById = function(idGiven){
        return new Promise(function(resolve, reject){
            QueryDisplayedFields.one({id: idGiven}, function(err, query){
                if(!err){
                    resolve(query);
                }else{
                    reject(err);
                }
            });
        });
    };

    QueryDisplayedFields.addDisplayedFieldForQuery = function(field_id, query_id){
        return new Promise(function(resolve, reject){
            QueryDisplayedFields.find({query_id: query_id, field_id: field_id}, function(err, fields){
                if(fields.length == 0){
                    QueryDisplayedFields.create({
                        query_id: query_id,
                        field_id: field_id
                    }, function(err2){
                        if(!err2){
                            resolve();
                        } else {
                            reject();
                        }
                    });
                }
            });
        });
    };

    QueryDisplayedFields.removeDisplayedFieldWithIdForQuery = function(id){
        return new Promise(function(resolve, reject){
            QueryDisplayedFields.one({field_id: id}, function(err, displayedField){
                if(displayedField){
                    // We also need to remove it from potential ordering
                    ormLoader.model("QueryOrderingRule").then(function(QueryOrderingRule){
                        QueryOrderingRule.removeRuleWithIdFieldWithIdQuery(id, displayedField.query_id).then(function(){
                            displayedField.remove(function(err){
                                if(!err){ resolve(); }else{ reject(err); }
                            })
                        }, reject);
                    });
                }else{
                    reject(err);
                }
            });
        });
    };


    QueryDisplayedFields.removeAllDisplayedFieldsForQuery = function(id){
        return new Promise(function(resolve, reject){
            QueryDisplayedFields.find({query_id: id}, function(err, displayedFields){
                if(displayedFields){
                    var promises = [];

                    _.each(displayedFields, function(displayedField){
                        promises.push(new Promise(function(resolveLocal, rejectLocal) {
                            displayedField.remove(function(err){
                                if(err){
                                    rejectLocal(err);
                                }else{
                                    resolveLocal();
                                }
                            });
                        }));
                    });

                    Promise.all(promises).then(resolve, reject);
                }else{
                    reject(err);
                }
            });
        });
    };

    // Returns the list of DisplayedFields that contains the given field
    QueryDisplayedFields.usingField = function(id_field){
        return new Promise(function(resolve, reject){
            QueryDisplayedFields.find({field_id: id_field}, function(err, results){
                if(!err){
                    resolve(results);
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
