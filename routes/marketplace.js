var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));
var orm    = require(path.normalize(__dirname + '/../helpers/orm'));
var sitemap = require('express-sitemap');

exports.sitemap = function(req, res){
    orm.model(["Project"]).then(function(d){
        d.Project.allProjectsOrderedByCreationDate().then(function(projects){
            var map = {};
            for(var i = 0; i < projects.length; i++){
                map['/marketplace/project/'+projects[i].id] = ['get'];
            }

            sitemap({
                url: 'www.synchronise.io',
                http: 'https',
                cache: 86400000,
                map: map
            }).XMLtoWeb(res);
        });
    });
};

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
        orm.model(["Project","MarketPlaceCollection"]).then(function(d){
            var promises = [];
            var lastProjects = [];
            var gettingStarted = [];
            var mostPopularProjects = [];

            promises.push(new Promise(function(resolve, reject) {
                d.Project.lastPublishedProjects().then(function(projects){
                    lastProjects = _.compact(projects, function(project){
                        return project;
                    });
                    resolve();
                }, function(err){
                    reject();
                });
            }));

            promises.push(new Promise(function(resolve, reject) {
                d.Project.mostPopularProjects().then(function(projects){
                    mostPopularProjects = _.compact(projects, function(project){
                        return project;
                    });
                    resolve();
                }, function(err){
                    reject();
                });
            }));

            promises.push(new Promise(function(resolve, reject) {
                d.MarketPlaceCollection.collectionByName("gettingStarted").then(function(collection){
                    if(collection){
                        var promises2 = [];
                        _.each(collection.blocks, function(row){
                            switch (row.type) {
                                case "project":
                                    promises2.push(new Promise(function(resolve2, reject2) {
                                        d.Project.projectById(row.id).then(function(project){
                                            if(project){
                                                gettingStarted.push(project);
                                            }
                                            resolve2();
                                        });
                                    }));
                                    break;

                                default:
                                    resolve();
                            }
                        });

                        Promise.all(promises2).then(function(){
                            resolve();
                        });
                    }else{
                        resolve();
                    }
                }, function(err){
                    resolve();
                });
            }));

            Promise.all(promises).then(function(){
                assets.navbarButtonsState.marketplace = 'active';
                res.render('marketplace/home', {
                    url: req.protocol + '://' + req.get('host') + req.originalUrl,
                    user: user,
                    navbarButtonsState: assets.navbarButtonsState,
                    title: "Market place",
                    description: "Find reusable Cloud components to integrate in your apps in seconds.",
                    js: Array(
                        'marketplace/marketplace',
                        'libraries/loader'
                    ),
                    css: Array('made-by-synchronise/custom_online',
                               'made-by-synchronise/marketplace'),
                    hideNormalFooter: true,
                    lastProjects: lastProjects,
                    gettingStarted: gettingStarted,
                    mostPopularProjects: mostPopularProjects
                });
                assets.navbarButtonsStateReset();
            });
        });
    });
};

exports.project = function(req, res) {
    var id_project = req.params.id;

    userH.getUserObject(req, function(user){
        orm.model(["Project", "Component"]).then(function(d){
            var project;
            var components = {};
            var amountForks = {};
            var promises = [];

            promises.push(new Promise(function(resolve, reject) {
                d.Project.projectById(id_project).then(function(results){
                    project = results;
                    resolve();
                }, function(err){
                    reject(err);
                });
            }));

            promises.push(new Promise(function(resolve, reject) {
                d.Component.amountContributors(id_project).then(function(results){
                    amountContributors = results;
                    resolve();
                }, function(err){
                    reject(err);
                });
            }));

            promises.push(new Promise(function(resolve, reject) {
                // Should be published, and should not be forked
                d.Component.componentsForProject(id_project, true, true).then(function(results){
                    // Map components into what we want
                    var data = _.map(_.filter(results, function(row){
                        return row.published && row.approved;
                    }), function(row){
                        return {
                            id: row.id,
                            name: row.name,
                            tags: row.tags,
                            last_update: new Date(row.modified_at).toUTCString(),
                            current_version: 1,
                            executed_times: 0
                        };
                    });

                    // if a component does not have any tags we give it a default one
                    _.each(data, function(row){
                        if(!row.tags.length){
                            row.tags.push("a"); // No categories
                        }
                    });

                    // Structure the components in their tags
                    _.each(data, function(row){
                        _.each(row.tags, function(row2){
                            if(!components.hasOwnProperty(row2)){
                                components[row2] = [];
                            }

                            components[row2].push(row);
                        });
                    });

                    // Turn the object of components into an array
                    components = _.map(Object.keys(components), function(row){
                        var section = components[row];
                        _.sortBy(section, function(row2){
                            return row2.name;
                        });

                        return {
                            sectionTitle: row,
                            comps: section
                        }
                    });

                    // Order the new array of sections of components by section title
                    _.sortBy(components, function(row){
                        return row.sectionTitle;
                    });

                    resolve();
                }, function(){
                    reject();
                });
            }));

            promises.push(new Promise(function(resolve, reject) {
                d.Component.countComponentsForkedWithIdProject(id_project).then(function(amount){
                    amountForks["total"] = amount;
                    resolve();
                }, function(){
                    reject();
                });
            }));

            Promise.all(promises).then(function(){
                assets.navbarButtonsState.marketplace = 'active';
                res.render('marketplace/project', {
                    url: req.protocol + '://' + req.get('host') + req.originalUrl,
                    user: user,
                    navbarButtonsState: assets.navbarButtonsState,
                    title: project.name + " - Synchronise",
                    description: "Integrate " + project.name + " in your app javascript, node.js, objective-c, swift, android, php, ruby, python",
                    js: Array(
                        'marketplace/marketplace_project',
                        'libraries/loader'
                    ),
                    css: Array('made-by-synchronise/custom_online',
                               'made-by-synchronise/marketplace_project'),
                    hideNormalFooter: true,
                    project: project,
                    components: components,
                    amountForks: amountForks,
                    amountContributors: amountContributors
                });
                assets.navbarButtonsStateReset();
            }, function(err){
                console.log("An error occured");
                console.log(err);
            });
        });
    });
};
