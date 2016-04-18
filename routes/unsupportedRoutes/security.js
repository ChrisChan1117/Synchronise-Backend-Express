var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));

exports.security = function(req, res) {
    userH.getUserObject(req, function(user){
		assets.navbarButtonsState.features = 'active';
	    res.render('security', {
	        user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
	        navbarButtonsState: assets.navbarButtonsState,
            title: "Security",
            description: "Discover how Synchronise ensures your data remains safe and available at all times.",
	        js: Array(),
	        css: Array('made-by-synchronise/custom',
                       'made-by-synchronise/security')
	    });
	    assets.navbarButtonsStateReset();
	});
};
