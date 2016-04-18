var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
			assets.navbarButtonsState.dashboard = 'active';
			assets.navbarButtonsState.chartform = 'active';
		    res.render('chartform', {
		        user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        navbarButtonsState: assets.navbarButtonsState,
		        js: Array('pages/chartform'),
		        css: Array('made-by-synchronise/custom_online',
                           'made-by-synchronise/chartform'),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
		    res.redirect('/?display=login&backuri=chartform');
	    }
	});
};
