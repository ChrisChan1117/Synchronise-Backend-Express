var path       = require('path');
var underscore = require('underscore');
var assets     = require(path.normalize(__dirname + '/../helpers/assets'));
var userH      = require(path.normalize(__dirname + '/../helpers/user'));
var orm        = require(path.normalize(__dirname + '/../helpers/orm'));
var componentB = require(path.normalize(__dirname + '/../backend/component'));

// REST endpoint to execute a component
// Body
// - id: the id of the component
// - (optional)S_C: determines that the client is an Arduino, will format the result differently
// Headers
// - x-synchronise-public-key: the public key of the user
exports.execute = function(req, res){
    var canContinue = true;
    if(!req.body.id){
        res.status(500).send("You need to provide the ID of a component");
        canContinue = false;
    }

    if(!req.headers["x-synchronise-public-key"]){
        res.status(500).send("You need to provide a PUBLIC KEY");
        canContinue = false;
    }

    if(canContinue){
        var request = {
            params: _.extend({
                id_component : req.body.id
            }, req.body),
            public_key: req.headers["x-synchronise-public-key"]
        };

        res.success = function(data){
            var toReturn = data;
            if(req.body.hasOwnProperty('S_C')){
                // If client is arduino, we add an extra character at
                // the beginning to indicate the status
                if(req.body["S_C"]){
                    toReturn = "1"+data;
                }
            }
            res.status(200).send(toReturn);
        };

        res.error = function(message, code){
            var toReturn = message;
            if(req.body.hasOwnProperty('S_C')){
                // If client is arduino, we add an extra character at
                // the beginning to indicate the status
                if(req.body["S_C"]){
                    toReturn = "0"+message;
                }
            }
            res.status(500).send(toReturn);
        };

        componentB.executeComponent(request, res, "REST");
    }
};

// Displays the list of components for the current user
exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.component = 'active';
		    res.render('component/component', {
		        user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "Component",
                description: "Create update or remove a component",
		        js: Array(
                    'component/component',
                    'libraries/loader',
                    'libraries/timeAgo',
                    'projectsList',
                    'projectPicker'
                ),
		        css: Array(
                    'made-by-synchronise/custom_online',
                    'made-by-synchronise/component',
                    'made-by-synchronise/projectsList'
                ),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
            res.redirect('/?display=login&backuri=component');
	    }
	});
};

// Displays the edit page for a component
exports.edit = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			orm.model(["Component", "Project"]).then(function(d){
			    d.Component.componentById(req.query.id).then(function(comp){
                    if(comp){
                        var projectName = "";
                        var projectIcon = "";
                        var id_project = "";
                        if(comp.id_project){
                            id_project = comp.id_project;
                        }

                        new Promise(function(resolve, reject) {
                            // Prepare the data about the project holding the component
                            d.Project.projectById(id_project).then(function(proj){
                                if(proj){
                                    projectName = proj.name;
                                    projectIcon = proj.icon
                                    projectBgColor = proj.bg_color;
                                    projectTxtColor = proj.txt_color;
                                    projectCommunity = proj.community;
                                    resolve();
                                }else{
                                    reject("undefined project");
                                }
                            }, function(err){
                                reject(err);
                            });
                        }).then(function(){
                            // (is owner) OR (is an admin) OR (component is forked version)
                            // OR (project is community shared)
                            if(comp.user_id == user.id
                            || user.hasRole(["superadmin", "admin", "marketplaceValidation"])
                            || comp.is_forked
                            || projectCommunity){
                                assets.navbarButtonsState.dashboard = 'active';
                                assets.navbarButtonsState.component = 'active';

                                var params = {
                                    user: user,
                                    url: req.protocol + '://' + req.get('host') + req.originalUrl,
                                    navbarButtonsState: assets.navbarButtonsState,
                                    title: "Edit component",
                                    description: "Edit a component",
                                    js: Array(
                                        'component/edit',
                                        'component/edit_left_bar_code',
                                        'component/edit_left_bar_export',
                                        'component/edit_left_bar_setting',
                                        'component/edit_left_bar',
                                        'component/edit_right_bar',
                                        'libraries/loader',
                                        'libraries/timeAgo',
                                        'libraries/inputTypes',
                                        'libraries/typeahead',
                                        'dependencies/CodeMirrorStandalone',
                                        'dependencies/CodeMirrorJavascript',
                                        'dependencies/CodeMirrorLint',
                                        'dependencies/CodeMirrorSearch',
                                        'dependencies/CodeMirrorDialog',
                                        'dependencies/CodeMirrorMatchesBrackets',
                                        'dependencies/CodeMirrorAutoCloseBrackets',
                                        'dependencies/CodeMirrorFold',
                                        'dependencies/CodeMirrorHint',
                                        'dependencies/CodeMirrorActiveLine',
                                        'dependencies/CodeMirrorAutoFormat',
                                        'dependencies/CodeMirrorAnyWordHint',
                                        'dependencies/JSHint',
                                        'dependencies/inView',
                                        'dependencies/react-select',
                                        'dependencies/jsonViewer',
                                        'dependencies/jquery-resize',
                                        'helpers/url'
                                    ),
                                    css: Array(
                                        'made-by-synchronise/custom_online',
                                        'made-by-synchronise/component_edit',
                                        'libs/react-select',
                                        'libs/codemirror',
                                        'libs/jsonViewer'
                                    ),
                                    hideNormalFooter: true,
                                    componentName: comp.name,
                                    projectName: projectName,
                                    projectIcon: projectIcon,
                                    projectBgColor: projectBgColor,
                                    projectTxtColor: projectTxtColor,
                                    id_project: comp.id_project
                                };

                                if(!comp.is_forked){
                                    params.breadcrumb = true;
                                }

                                res.render('component/edit', params);
                                assets.navbarButtonsStateReset();
                            }else{
                                res.redirect('/component');
                            }
                        });
                    }else{
                        res.redirect('/component');
                    }
			    }, function(){
			        res.redirect('/component');
			    });
			});
	    }else{
            res.redirect('/?display=login&backuri='+ encodeURIComponent('component/edit?id='+req.query.id));
	    }
	});
};

exports.cloneComponent = function(req, res) {
    userH.getUserObject(req, function(user){
        if(user){
            orm.model(["Component"]).then(function(d){
                d.Component.componentById(req.params.id).then(function(component){
                    if(component){
                        if(user.id != component.user_id){ // User is not the owner of the component
                            d.Component.clone(component.id, user).then(function(forked){ // Fork the component. If the user already has forked the component it returns the same one not a new one
                                res.redirect('/component/edit?id='+forked.id);
                            });
                	    }else if(user.id == component.user_id){ // User is the owner of the component
                            res.redirect('/component/edit?id='+component.id);
                	    }else{
                            res.redirect('/marketplace?display=login&backuri='+encodeURIComponent("component/clone/"+req.params.id));
                        }
                    }else{
                        res.redirect('/marketplace?display=login&backuri=marketplace');
                    }
                });
            });
        }else{
            res.redirect('/marketplace?display=login&backuri='+encodeURIComponent("component/clone/"+req.params.id));
        }
	});
};
