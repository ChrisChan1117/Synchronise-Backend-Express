var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.logs      = 'active';
		    res.render('logs/logs', {
		        user: user,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "Logs",
                description: "Track all of the information you need about your account",
		        js: Array(
                    'logs/logs',
                    'libraries/loader',
                    'libraries/timeAgo'
                ),
		        css: Array(
                    'made-by-synchronise/custom_online',
                    'made-by-synchronise/logs'
                ),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
            res.redirect('/?display=login&backuri=logs');
	    }
	});
};

exports.section = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.logs      = 'active';
		    res.render('logs/section', {
		        user: user,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "Logs",
                description: "Track all of the information you need about your account",
		        js: Array(
                    'logs/section',
                    'libraries/loader',
                    'libraries/timeAgo'
                ),
		        css: Array(
                    'made-by-synchronise/custom_online',
                    'made-by-synchronise/logs_section'
                ),
                breadcrumb: true,
		        hideNormalFooter: true,
                sectionName: req.query.id.charAt(0).toUpperCase() + req.query.id.slice(1)
		    });
		    assets.navbarButtonsStateReset();
	    }else{
            res.redirect('/?display=login&backuri='+encodeURIComponent("logs/section?id="+req.query.id));
	    }
	});
};
