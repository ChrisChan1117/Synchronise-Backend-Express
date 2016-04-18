var url      = require('url');
var moment   = require('moment');
var path     = require('path');
var assets   = require(path.normalize(__dirname + '/../helpers/assets'));
var userH    = require(path.normalize(__dirname + '/../helpers/user'));
var projectH = require(path.normalize(__dirname + '/../helpers/project'));
var orm      = require(path.normalize(__dirname + '/../helpers/orm'));
var Promise  = require('promise');

exports.home = function(req, res) {
    userH.getUserObject(req, function(user) {
		if (user) {
            var roles = Array();
            var projects = Array();
            var promises = Array();

            // COLLECT THE LIST OF ROLES FOR THE CURRENT USER
            promises.push(userH.rolesOfUser(user).then(function(rolesFound){
                roles = rolesFound;
            }, function(err){}));

            // COLLECT THE LIST OF PROJECTS OF THE USER
            promises.push(orm.model("Project").then(function(Project){
                return Project.projectsForUser(user).then(function(projectsFound){
                    projects = projectsFound;
                }, function(err){});
            }));

            // DISPLAY THE PAGE ONCE WE ARE READY
            Promise.all(promises).then(function(){
                assets.navbarButtonsState.dashboard = 'active';
                assets.navbarButtonsState.query = 'active';
                res.render('query/query', {
                    user              : user,
                    url: req.protocol + '://' + req.get('host') + req.originalUrl,
                    roles             : roles,
                    navbarButtonsState: assets.navbarButtonsState,
                    js: Array('libraries/modalMessage',
                              'libraries/security',
                              'libraries/loader',
                              'dependencies/aes',
                              'dependencies/jsonFormatter',
                              'dependencies/jquery.jsPlumb-1.7.2-min',
                              'query/query'),
                    css: Array('made-by-synchronise/custom_online',
                               'made-by-synchronise/query'),
                    hideNormalFooter  : true,
                    projects          : projects,
                    assets            : assets
                });
                assets.navbarButtonsStateReset();
            });
		}else{
            res.redirect('/?display=login&backuri=query');
		}
	});
};

exports.project = function(req, res) {
    userH.getUserObject(req, function(user) {
		if (user) {
            userH.rolesOfUser(user).then(function(roles){
                var parameter = url.parse(req.url,true).query;

                var queries             = Array();
                var projectObject;
                var totalQueries        = 0;
                var canContinue         = true;
                var currentPage         = 0;
                var limitQueriesPerPage = 20;
                var orderField          = "createdAt";
                var authorisedFields    = Array('createdAt', 'updatedAt', 'name');
                var order               = "descending";
                var authorisedOrder     = Array('ascending', 'descending');

                if(typeof(parameter.page) != "undefined"){
                    currentPage = parseInt(parameter.page);
                }

                if(typeof(parameter.orderField) != "undefined"){
                    if(authorisedFields.indexOf(parameter.orderField) != -1){
                        orderField = parameter.orderField;
                    }
                }

                if(typeof(parameter.order) != "undefined"){
                    if(authorisedOrder.indexOf(parameter.order) != -1){
                        order = parameter.order;
                    }
                }

                orm.model("Project").then(function(Project){
                    Project.projectById(parameter.id).then(function(projectObj){
                        if(projectObj){
                            projectObject = projectObj;
                        }else{
                            canContinue = false;
                            res.redirect('/query');
                        }
                    }, function(err){
                        canContinue = false;
                        res.redirect('/query');
                    }).then(function(){
                        if(canContinue){
                            var promises = Array();

                            promises.push(function(){
                              return Project.queries({
                                  project    : projectObject,
                                  skip       : currentPage*limitQueriesPerPage,
                                  limit      : limitQueriesPerPage,
                                  order      : order,
                                  orderField : orderField
                              }).then(function(queriesObjs){
                                  queries = queriesObjs;
                              }, function(){});
                            });

                            promises.push(function(){
                              return Project.queriesCount(project).then(function(count){
                                  totalQueries = count;
                              }, function(){});
                            });

                            return Promise.all(promises);
                        }
                    }).then(function(){
                        if(canContinue){
                            assets.navbarButtonsState.dashboard = 'active';
                            assets.navbarButtonsState.query = 'active';
                            res.render('query/project', {
                                user               : user,
                                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                                roles              : roles,
                                navbarButtonsState : assets.navbarButtonsState,
                                js: Array('libraries/modalMessage',
                                          'libraries/security',
                                          'libraries/loader',
                                          'libraries/timeAgo',
                                          'dependencies/aes',
                                          'dependencies/jsonFormatter',
                                          'dependencies/jquery.jsPlumb-1.7.2-min',
                                          'helpers/query',
                                          'query/queryProject'),
                                css: Array('made-by-synchronise/custom_online',
                                           'made-by-synchronise/projectQueries'),
                                hideNormalFooter   : true,
                                breadcrumb         : true,
                                project            : projectObject,
                                queries            : queries,
                                totalQueries       : totalQueries,
                                moment             : moment,
                                order              : order,
                                orderField         : orderField,
                                limitQueriesPerPage: limitQueriesPerPage,
                                currentPage        : currentPage
                            });
                            assets.navbarButtonsStateReset();
                        }
                    });
                });
            }, function(error){
                response.error(error);
            });
		}else{
            var uri = "/?display=login";

            if(typeof(req.query) != "undefined"){
                if(typeof(req.query.id) != "undefined"){
                    uri = '/?display=login&backuri=' + encodeURIComponent('query/project?id='+req.query.id);
                }
            }
            res.redirect(uri);
		}
	});
};

exports.insert = function(req, res) {
    var parameters = url.parse(req.url,true).query;
    var projectObject;
    var queryObject;
    var userObject;
    var canContinue = true;

    userH.getUserObject(req, function(user) {
        if(user){
            userObject = user;
            projectH.projectObject(parameters.id, {
                success: function(success){
                    if(success){
                        projectObject = success;
                    }else{
                        canContinue = false;
                        res.redirect('/query/project?id='+parameters.id);
                    }
                },
                error: function(error){
                    canContinue = false;
                    res.redirect('/query/project?id='+parameters.id);
                }
            }).then(function(){
                if(canContinue){
                    if(typeof(parameters.query) != "undefined"){
                        var queryForQuery = new Parse.Query('Query');
                        queryForQuery.equalTo('objectId', parameters.query);
                        return queryForQuery.first({
                            success: function(success){
                                if(success){
                                    queryObject = success;
                                }else{
                                    canContinue = false;
                                    res.redirect('/query/project?id='+parameters.id);
                                }
                            }
                        });
                    }
                }
            }).then(function(){
                if(canContinue){
                    assets.navbarButtonsState.dashboard = 'active';
                    assets.navbarButtonsState.query = 'active';
                    res.render('query/query_insert', {
                        user: userObject,
                        url: req.protocol + '://' + req.get('host') + req.originalUrl,
                        navbarButtonsState: assets.navbarButtonsState,
                        js: Array(),
                        css: Array(),
                        hideNormalFooter: true,
                        breadcrumb: true,
                        project: projectObject,
                        query: queryObject
                    });
                    assets.navbarButtonsStateReset();
                }
            });
        }else{
            var uri = "/?display=login";
            var eventualParameters = "";

            if(typeof(req.query) != "undefined"){
                if(typeof(req.query.id) != "undefined"){
                    eventualParameters = 'query/insert?id='+req.query.id+'&query='+req.query.query+'&block='+req.query.block;
                    uri = '/?display=login&backuri='+encodeURIComponent(eventualParameters);
                }
            }

            res.redirect(uri);
        }
    });
};

exports.retrieve = function(req, res) {
	var parameters = url.parse(req.url,true).query;
	var projectObject;
	var queryObject;
	var userObject;
	var canContinue = true;

	userH.getUserObject(req, function(user) {
		if(user){
			userObject = user;
      orm.model("Project").then(function(Project){
        Project.projectById(parameters.id).then(function(project){
          projectObject = project;
        }, function(err){
          canContinue = false;
          res.redirect('/query/project?id='+parameters.id);
        }).then(function(){
  				if(canContinue){
  					if(typeof(parameters.query) != "undefined"){
              return orm.model("Query").then(function(Query){
                return Query.queryById(parameters.query).then(function(query){
                  queryObject = query;
                }, function(err){
                  canContinue = false;
                  res.redirect('/query/project?id='+parameters.id);
                });
              });
  					}
  				}
  			}).then(function(){
  				if(canContinue){
  					assets.navbarButtonsState.dashboard = 'active';
  					assets.navbarButtonsState.query = 'active';
  					res.render('query/retrieve', {
  						user: userObject,
                        url: req.protocol + '://' + req.get('host') + req.originalUrl,
  						navbarButtonsState: assets.navbarButtonsState,
                          js: Array('libraries/panel',
                                    'libraries/panelFlow',
                                    'libraries/loader',
                                    'libraries/databaseFunctions',
                                    'helpers/code',
                                    'libraries/security',
                                    'libraries/typeahead',
                                    'query/retrieve/query_create',
                                    'query/retrieve/query_datastore',
                                    'query/retrieve/query_name',
                                    'query/retrieve/query_fields',
                                    'query/retrieve/query_rules',
                                    'query/retrieve/query_ordering',
                                    'query/retrieve/query_exports',
                                    'query/retrieve/query_result_preview',
                                    'libraries/databaseFunctions',
                                    'dependencies/switchery.min',
                                    'dependencies/moment.min',
                                    'dependencies/bootstrap-datetimepicker'),
                          css: Array('made-by-synchronise/custom_online',
                                     'made-by-synchronise/query_retrieve',
                                     'libs/switchery.min',
                                     'libs/originalFiles/bootstrap-datetimepicker.min'),
  						hideNormalFooter: true,
  						breadcrumb: true,
  						project: projectObject,
  						query: queryObject
  					});
  					assets.navbarButtonsStateReset();
  				}
  			});
      });
		}else{
            var uri = "/?display=login";
            var eventualParameters = "";

            if(typeof(req.query) != "undefined"){
                if(typeof(req.query.id) != "undefined"){
                    eventualParameters = 'query/retrieve?id='+req.query.id+'&query='+req.query.query+'&block='+req.query.block;
                    uri = '/?display=login&backuri='+encodeURIComponent(eventualParameters);
                }
            }

            res.redirect(uri);
		}
	});
};

exports.update = function(req, res) {
};

exports.delete = function(req, res) {
};
