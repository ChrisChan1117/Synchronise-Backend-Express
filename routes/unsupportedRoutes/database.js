var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));
var orm    = require(path.normalize(__dirname + '/../helpers/orm'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
        if(user){
            assets.navbarButtonsState.dashboard = 'active';
            assets.navbarButtonsState.database = 'active';
            res.render('database/database', {
                user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                navbarButtonsState: assets.navbarButtonsState,
                js: Array('libraries/panel',
                          'libraries/panelFlow',
                          'libraries/security',
                          'libraries/databaseFunctions',
                          'libraries/loader',
                          'pages/database',
                          'dependencies/aes',
                          'dependencies/transit',
                          'dependencies/jsonFormatter'),
                css: Array('made-by-synchronise/custom_online',
                           'made-by-synchronise/database'),
                hideNormalFooter: true
            });
            assets.navbarButtonsStateReset();
        }else{
            res.redirect('/?display=login&backuri=database');
        }
	});
};
