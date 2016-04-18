var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));
var orm    = require(path.normalize(__dirname + '/../helpers/orm'));


exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.project = 'active';
		    res.render('project', {
		        user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "Project",
                description: "Create update or remove a project",
                js: Array(
                          'dependencies/aes',
                          'dependencies/jsonFormatter',
                          'dependencies/bootstrap-colorpicker.min',
                          'libraries/security',
                          'libraries/typeahead',
                          'libraries/loader',
                          'project/project',
                          'project/project_info',
                          'project/project_team',
                          'project/project_store'
                         ),
		        css: Array(
                          'made-by-synchronise/custom_online',
                          'made-by-synchronise/project',
                          'made-by-synchronise/libraries/typeahead',
                          'libs/bootstrap-colorpicker.min'
                          ),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
		    res.redirect('/?display=login&backuri=project');
	    }
	});
};

// Let a developer contribute to a project
exports.contribute = function(req, res){
    var id_project = req.params.id_project;

    userH.getUserObject(req, function(user){
		if(user){
            orm.model(["Project", "ProjectShared"]).then(function(d){
                d.Project.projectById(id_project).then(function(project){
                    return new Promise(function(resolve, reject) {
                        if(project.user_id != user.id){
                            d.ProjectShared.addMemberToProject(id_project, user.id, {own: false, edit: true, view: true}).then(function(){
                                resolve();
                            });
                        }else{
                            resolve();
                        }
                    });
                }).then(function(){
                    res.redirect('/component?projectOpened='+id_project);
                });
            });
        }else{
            res.redirect('/?display=login&backuri=project/contribute/'+id_project);
        }
    });
};
