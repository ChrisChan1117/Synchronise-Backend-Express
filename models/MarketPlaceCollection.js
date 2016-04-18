var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));

module.exports = function (db, cb) {
    db.define('marketplacecollection', {
        name   : { type: "text" },
        image  : { type: "text" },
        title  : { type: "text", defaultValue: 'New section' },
        order  : { type: "integer", defaultValue: 0 },
        blocks : { type: "text", defaultValue: '{"data": []}' }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            name : redis.index.discrete
        }
    });

    global.MarketPlaceCollection = db.models.marketplacecollection;

    // Return a collection of the market place using its id
    // Params:
    // - (string)id: the ID of the collection to return
    MarketPlaceCollection.collectionById = function(id){
        return new Promise(function(resolve, reject) {
            MarketPlaceCollection.one({id: id}, function(err, object){
                if(err){
                    reject(err);
                }else{
                    if(!object){
                        reject("Undefined Market Place Collection");
                    }else{
                        object.blocks = JSON.parse(object.blocks).data;
                        resolve(object);
                    }
                }
            });
        });
    };

    // Return a collection by its name
    // Params :
    // - (string)name : The name of the collection to return
    MarketPlaceCollection.collectionByName = function(name){
        return new Promise(function(resolve, reject) {
            MarketPlaceCollection.one({name: name}, function(err, object){
                if(err){
                    reject(err);
                }else{
                    if(!object){
                        reject("Undefined Market Place Collection");
                    }else{
                        MarketPlaceCollection.collectionById(object.id).then(function(collection){
                            resolve(collection);
                        }, function(err){
                            reject(err);
                        });
                    }
                }
            });
        });
    };

    // Returns all the collections
    MarketPlaceCollection.collections = function(){
        return new Promise(function(resolve, reject) {
            MarketPlaceCollection.find({}, function(err, collections){
                if(err){
                    reject(err);
                }else{
                    var promises = [];
                    var collectionsObjects = [];

                    _.each(collections, function(row){
                        promises.push(new Promise(function(resolve, reject) {
                            MarketPlaceCollection.collectionById(row.id).then(function(collection){
                                collectionsObjects.push(collection);
                                resolve();
                            }, reject);
                        }));
                    });

                    Promise.all(promises).then(function(){
                        resolve(collectionsObjects);
                    });
                }
            });
        });
    };

    // Add a new section in the marketplace
    MarketPlaceCollection.addSection = function(){
        return new Promise(function(resolve, reject) {
            MarketPlaceCollection.create({
                name: "New section"
            }, function(err, section){
                if(err){
                    reject(err);
                }else{
                    resolve();
                }
            });
        });
    };

    // Parameters
    // - (string)id: id of the section to update
    MarketPlaceCollection.updateSection = function(data){
        return new Promise(function(resolve, reject) {
            var properties = {};

            MarketPlaceCollection.collectionById(data.id).then(function(collection){
                properties = collection;

                _.each(Object.keys(data), function(key){
                    properties[key] = data[key];
                });

                properties.blocks = JSON.stringify({"data": properties.blocks});

                collection.save(properties, function(err, newObject){
                    if(err){
                        reject(err);
                    }else{
                        resolve(newObject);
                    }
                });
            }, function(err){
                reject(err);
            });
        });
    };

    // Remove a collection from the market place
    // - (string)id: the id of the section to remove
    MarketPlaceCollection.removeSection = function(id){
        return new Promise(function(resolve, reject) {
            MarketPlaceCollection.collectionById(id).then(function(collection){
                collection.remove(function(){
                    resolve();
                });
            }, function(err){
                reject(err);
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
