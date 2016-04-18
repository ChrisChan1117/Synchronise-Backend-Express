var path    = require('path');
var assets  = require(path.normalize(__dirname + '/../helpers/assets'));
var userH   = require(path.normalize(__dirname + '/../helpers/user'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
        if(user){
            assets.navbarButtonsState.dashboard = 'active';
            assets.navbarButtonsState.subdashboard = 'active';
            res.render('connect', {
                user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                navbarButtonsState: assets.navbarButtonsState,
                title: "Connect",
                description: "Integrate our platform in your app/project",
                js: Array(
                    'pages/connect',
                    'libraries/loader'
                ),
                css: Array('made-by-synchronise/custom_online',
                           'made-by-synchronise/connect'),
                hideNormalFooter: true
            });
            assets.navbarButtonsStateReset();
        }else{
            res.redirect('/?display=login&backuri=connect');
        }
	});
};
