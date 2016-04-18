// Everything related to the marketplace

var path          = require('path');
var _             = require('underscore');
var Promise       = require('promise');
var userH         = require(path.normalize(__dirname + '/../helpers/user'));
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));

// Returns the collection for the Header Carousel on the marketplace
exports.marketPlaceHeaderCarousel = function(request, response){
    orm.model(["MarketPlaceCollection"]).then(function(d){
        d.MarketPlaceCollection.collectionByName("carouselHeader").then(function(collection){
            response.success(collection);
        }, function(err){
            response.error(err);
        });
    });
};

// Get the list of sections of the marketplace
exports.getSectionsMarketPlace = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["MarketPlaceCollection"]).then(function(d){
                d.MarketPlaceCollection.collections().then(function(collections){
                    response.success(collections);
                });
            });
        }else{
            response.error("You are not allowed to execute this function (getSectionsMarketPlace)");
        }
    }, ["superadmin", "marketplace"]);
};

// Get a specific section of the marketplace using its ID
// Param
// - (string)id
exports.getSectionMarketPlaceById = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["MarketPlaceCollection"]).then(function(d){
                d.MarketPlaceCollection.collectionById(request.params.id).then(function(collection){
                    response.success(collection);
                }, function(err){
                    response.error(err);
                });
            });
        }else{
            response.error("You are not allowed to execute this function (getSectionMarketPlaceById)");
        }
    }, ["superadmin", "marketplace"]);
};

// Add a section to the marketplace
exports.addSectionMarketPlace = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["MarketPlaceCollection"]).then(function(d){
                d.MarketPlaceCollection.addSection().then(function(){
                    response.success();
                });
            });
        }else{
            response.error("You are not allowed to execute this function (addSectionMarketPlace)");
        }
    }, ["superadmin", "marketplace"]);
};

// Update the data of a section of the marketplace
// Params
// The parameters are not defined here, they are evolving rapidly so they are set from the client
exports.updateSectionMarketPlace = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["MarketPlaceCollection"]).then(function(d){
                d.MarketPlaceCollection.updateSection(request.params).then(function(){
                    response.success();
                });
            });
        }else{
            response.error("You are not allowed to execute this function (updateSectionMarketPlace)");
        }
    }, ["superadmin", "marketplace"]);
};

// Remove a section of the marketplace
// Params
// - (string)id: The id of the section to remove
exports.removeSectionMarketPlace = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["MarketPlaceCollection"]).then(function(d){
                d.MarketPlaceCollection.removeSection(request.params.id).then(function(){
                    response.success();
                });
            });
        }else{
            response.error("You are not allowed to execute this function (removeSectionMarketPlace)");
        }
    }, ["superadmin", "marketplace"]);
};

// Search items on the marketplace
// Params
// - (string)search: The search string
// - (string)type: The type of research (project or collection)
exports.searchForItemsInMarketPlace = function(request, response){
    new Promise(function(resolve, reject) {
        switch (request.params.type) {
            case "project":
                orm.model(["Project"]).then(function(d){
                    d.Project.searchWithName(request.params.search, true).then(function(projects){
                        resolve(_.map(projects, function(row){
                            return {
                                id: row.id,
                                type: "project",
                                name: row.name,
                                icon: row.icon
                            };
                        }));
                    });
                });
                break;

            /*case "collection":
                orm.model(["MarketPlaceCollection"], true).then(function(d){
                    d.MarketPlaceCollection.searchWithName(request.params.search).then(function(collections){
                        resolve(_.map(collections, function(row){
                            return {
                                id: row.id,
                                type: "collection",
                                name: row.title
                            };
                        }));
                    });
                });
                break;*/
        }
    }).then(function(data){
        response.success(data);
    });
};

// Return the list of the last published projects
exports.lastPublishedProjects = function(request, response){
    orm.model(["Project"]).then(function(d){
        d.Project.lastPublishedProjects().then(function(projects){
            response.success(projects);
        }, function(err){
            response.error(err);
        });
    });
};
