var path    = require('path');
var assets  = require(path.normalize(__dirname + '/../helpers/assets'));
var userH   = require(path.normalize(__dirname + '/../helpers/user'));
var Promise = require('promise');

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
        if(user){
            assets.navbarButtonsState.dashboard = 'active';
            assets.navbarButtonsState.subdashboard = 'active';
            res.render('dashboard', {
                user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                navbarButtonsState: assets.navbarButtonsState,
                title: "Dashboard",
                description: "Get a quick look at your Synchronise' account",
                js: Array(
                    'pages/dashboard',
                    'libraries/loader',
                    'libraries/tutorialModal'
                ),
                css: Array('made-by-synchronise/custom_online',
                           'made-by-synchronise/dashboard'),
                hideNormalFooter: true
            });
            assets.navbarButtonsStateReset();
        }else{
            res.redirect('/?display=login&backuri=dashboard');
        }
	});
};
