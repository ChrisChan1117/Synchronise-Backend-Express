var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));
var orm    = require(path.normalize(__dirname + '/../helpers/orm'));
var workflowB = require(path.normalize(__dirname + '/../backend/workflow'));

// REST Endpoint to execute a Workflow
// Body
// - id: The id of the workflow to execute
// Headers
// - x-synchronise-public-key: The public key of the user executing
exports.execute = function(req, res){
    var request = {
        params: _.extend({
            id_workflow : req.body.id
        }, req.body),
        public_key: req.headers["x-synchronise-public-key"]
    };

    res.success = function(data){
        var toReturn = data;
        if(req.body.hasOwnProperty('S_C')){
            // If client is arduino, we add an extra character at the beginning to indicate the status
            if(req.body["S_C"]){
                toReturn = "1"+data;
            }
        }
        res.status(200).send(toReturn);
    };

    res.error = function(message, code){
        var toReturn = message;
        if(req.body.hasOwnProperty('S_C')){
            // If client is arduino, we add an extra character at the beginning to indicate the status
            if(req.body["S_C"]){
                toReturn = "0"+message;
            }
        }
        res.status(500).send(toReturn);
    };

    workflowB.executeComponent(request, res, "REST");
};

// Displays the list of workflows owned by the user
exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.workflow = 'active';
		    res.render('workflow/workflow', {
		        user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "Workflow",
                description: "Workflow is a smart way to create intelligent backends without code. Send Emails, Push Notifications, Sms, Google Drive and much more...",
		        js: Array(
                    'workflow/workflow',
                    'libraries/loader',
                    'libraries/timeAgo',
                    'projectsList',
                    'projectPicker'),
		        css: Array(
                    'made-by-synchronise/custom_online',
                    'made-by-synchronise/workflow',
                    'made-by-synchronise/projectsList'
                ),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
            res.redirect('/?display=login&backuri=workflow');
	    }
	});
};

// Displays the edit page of a workflow
exports.edit = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			orm.model(["Workflow", "Project"]).then(function(d){
			    d.Workflow.workflowById(req.query.id).then(function(workflow){
                    if(workflow){
                        var projectName = "";
                        var id_project = "";
                        var workflowName = workflow.name;

                        if(workflow.id_project){
                            id_project = workflow.id_project;
                        }

                        d.Project.projectById(id_project).then(function(proj){
                            if(proj){
                                projectName = proj.name;
                            }
                        }).then(function(){
                            assets.navbarButtonsState.dashboard = 'active';
                			assets.navbarButtonsState.workflow = 'active';
                		    res.render('workflow/edit', {
                		        user: user,
                                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                		        navbarButtonsState: assets.navbarButtonsState,
                                title: "Edit workflow",
                                description: "Edit a workflow",
                		        js: Array(
                                    'workflow/edit',
                                    'workflow/edit_input',
                                    'workflow/edit_inputs_values',
                                    'workflow/edit_output',
                                    'workflow/edit_settings_tab',
                                    'workflow/edit_components',
                                    'workflow/edit_component',
                                    'workflow/edit_component_catalog',
                                    'workflow/edit_export',
                                    'workflow/edit_export_tab',
                                    'libraries/loader',
                                    'libraries/timeAgo',
                                    'libraries/typeahead',
                                    'libraries/inputTypes',
                                    'dependencies/jsonViewer',
                                    'dependencies/jquery-resize',
                                    'helpers/url'
                                ),
                		        css: Array(
                                    'made-by-synchronise/custom_online',
                                    'made-by-synchronise/workflow_edit',
                                    'libs/jsonViewer',
                                    'made-by-synchronise/libraries/typeahead'
                                ),
                		        hideNormalFooter: true,
                                breadcrumb: true,
                                id_project: id_project,
                                projectName: projectName,
                                workflowName: workflowName
                		    });
                		    assets.navbarButtonsStateReset();
                        });
                    }else{
                        res.redirect('/workflow');
                    }
			    }, function(){
			        res.redirect('/workflow');
			    });
			});
	    }else{
            res.redirect('/?display=login&backuri='+ encodeURIComponent('workflow/edit?id='+req.query.id));
	    }
	});
};
