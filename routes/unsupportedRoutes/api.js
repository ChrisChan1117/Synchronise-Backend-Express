var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		var databases = Array();

		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.api = 'active';
		    res.render('api', {
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        user: user,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "API Synchronise",
                description: "Find your API keys for your apps",
                js: Array('libraries/security',
                          'pages/api',
                          'dependencies/aes',
                          'dependencies/jsonFormatter'),
		        css: Array('made-by-synchronise/custom_online',
                           'made-by-synchronise/api'),
		        hideNormalFooter: true,
		        api: user.get('public_key')
		    });
		    assets.navbarButtonsStateReset();
	    }else{
		    res.redirect('/?display=login&backuri=api');
	    }
	});
};
