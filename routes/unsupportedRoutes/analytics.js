var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.analytics = 'active';
		    res.render('analytics', {
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        user: user,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "Analytics",
                description: "Analytics on the usage of your apps on Synchronise",
		        js: Array('pages/analytics'),
		        css: Array('made-by-synchronise/custom_online',
                           'made-by-synchronise/analytics'),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
            res.redirect('/?display=login&backuri=analytics');
	    }
	});
};
