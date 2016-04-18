var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var promise         = require('promise');

module.exports = function (db, cb) {
    db.define('queryorderingrule', {
        id_field        : { type: "text"                 },
        id_query        : { type: "text"                 },
        orderingAscDesc : { type: "text", defaultValue: "asc" },
        position        : { type: "number", defaultValue: 1   }
    }, {
        timestamp   : true,
        indexes : {
            orderingAscDesc : redis.index.discrete,
            id_field        : redis.index.discrete,
            id_query        : redis.index.discrete,
            position        : redis.index.discrete
        },
        hooks: {
            beforeCreate: function (next) {
                var target = this;
                QueryOrderingRule.count({id_query: this.id_query}, function(err, count){
                    if(!err){
                        target.position = count+1;
                        return next();
                    }else{
                        return next(new Error(err));
                    }
                });
            }
        }
    });

    global.QueryOrderingRule = db.models.queryorderingrule;

    QueryOrderingRule.rulesForQuery = function(query_id){
        return new Promise(function(resolve, reject){
            QueryOrderingRule.find({id_query: query_id}, function(err, results){
                if(!err){
                    resolve(results);
                }else{
                    reject(err);
                }
            });
        });
    };

    QueryOrderingRule.createRule = function(id_field, id_query){
        return new Promise(function(resolve, reject){
            QueryOrderingRule.one({id_field: id_field, id_query: id_query}, function(err, rule){
                if(!err){
                    if(!rule){
                        QueryOrderingRule.create({
                            id_field: id_field,
                            id_query: id_query
                        }, function(err, rule){
                            if(!err){
                                resolve(rule);
                            }else{
                                reject(err);
                            }
                        });
                    }else{
                        resolve(rule);
                    }
                }else{
                    reject(err);
                }
            });
        });
    };

    QueryOrderingRule.removeRule = function(id_rule){
        return new Promise(function(resolve, reject){
            QueryOrderingRule.one({id: id_rule}, function(err, object){
                if(err){ reject(err); }else{
                    if(object){
                        object.remove(function(err){
                            if(!err){ resolve(); }else{ reject(err); }
                        });
                    }else{
                        reject(err);
                    }
                }
            });
        });
    };

    QueryOrderingRule.removeRuleWithIdFieldWithIdQuery = function(id_field, id_query){
        return new Promise(function(resolve, reject){
            QueryOrderingRule.one({id_field: id_field, id_query:id_query}, function(err, object){
                if(err){ reject(err); }else{
                    if(object){
                        object.remove(function(err){
                            if(!err){ resolve(); console.log("removed field"); }else{ reject(err); }
                        });
                    }else{
                        resolve();
                    }
                }
            });
        });
    };

    QueryOrderingRule.removeAllOrderingRulesForQuery = function(id_query){
        return new Promise(function(resolve, reject) {
            QueryOrderingRule.find({id_query: id_query}, function(err, rules){
                var promises = [];

                _.each(rules, function(row){
                    promises.push(new Promise(function(resolve2, reject2) {
                        row.remove(function(err){
                            if(err){ reject2(err); }else{ resolve2(); }
                        });
                    }));
                });

                Promise.all(promises).then(resolve, reject);
            });
        });
    };

    // Returns the list of OrderingRules that use the given field
    QueryOrderingRule.usingField = function(id_field){
        return new Promise(function(resolve, reject){
            QueryOrderingRule.find({id_field: id_field}, function(err, results){
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
