var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var promise         = require('promise');

module.exports = function (db, cb) {
    db.define('mysqlqueriespool', {
        queryTimestamp : { type: "date", time: true, defaultValue: function(){ return new Date(); } },
        databaseType   : { type: "text" },
        databaseId     : { type: "text" },
        queryId        : { type: "text" },
        executed       : { type: "boolean", defaultValue: false },
        running        : { type: "boolean", defaultValue: false },
        succeeded      : { type: "boolean", defaultValue: false }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            queryTimestamp : redis.index.discrete,
            databaseType   : redis.index.discrete,
            databaseId     : redis.index.discrete,
            queryId        : redis.index.discrete,
            executed       : redis.index.discrete
        }
    });

    global.MySQLQueriesPool = db.models.mysqlqueriespool;

    MySQLQueriesPool.queriesRunningForDatabase = function(databaseID){
        return new Promise(function(resolve, reject){
            MySQLQueriesPool.count({databaseId:databaseID, running: true}, function(err, queriesRunning){
                if(!err){
                    resolve(queriesRunning);
                }else{
                    reject(err);
                }
            });
        });
    };

    MySQLQueriesPool.nextIdAllowedForDatabase = function(databaseID){
        return new Promise(function(resolve, reject){
            MySQLQueriesPool.find({databaseId:databaseID, running: false, executed: false}, {order: "queryTimestamp", limit:1}, function(err, nextQueryAllowed){
                if(!err){
                    if(nextQueryAllowed.length){
                        resolve(nextQueryAllowed[0].id);
                    }else{
                        resolve(false);
                    }
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
