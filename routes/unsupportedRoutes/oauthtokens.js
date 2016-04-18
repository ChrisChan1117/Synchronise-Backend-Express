var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.analytics = 'active';
		    res.render('oauthtokens/oauthtokens', {
		        user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "OAuth Tokens",
                description: "Synchronise simplifies the process of collecting the OAuth Tokens from a user for your app.",
		        js: Array('pages/oauthtokens'),
		        css: Array(
                    'made-by-synchronise/custom_online',
                    'made-by-synchronise/oauthtokens'
                ),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
            res.redirect('/?display=login&backuri=oauthtokens');
	    }
	});
};
