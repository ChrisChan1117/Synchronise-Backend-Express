var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));
var orm    = require(path.normalize(__dirname + '/../helpers/orm'));

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
        if(user){
            userH.hasRole(user, ["superadmin", "docwriter", "marketplace", "marketplaceValidation"]).then(function(hasRole){
                if(hasRole){
                    assets.navbarButtonsState.dashboard = 'active';
                    assets.navbarButtonsState.superadmin = 'active';
                    res.render('superadmin', {
                        user: user,
                        url: req.protocol + '://' + req.get('host') + req.originalUrl,
                        navbarButtonsState: assets.navbarButtonsState,
                        js: Array('superadmin/superadmin',
                                  'superadmin/database',
                                  'superadmin/realtime',
                                  'superadmin/populate',
                                  'superadmin/marketplace',
                                  'superadmin/marketplace_validation',
                                  'superadmin/docs',
                                  'libraries/panel',
                                  'libraries/panelFlow',
                                  'libraries/typeahead',
                                  'libraries/loader'),
                        css: Array('made-by-synchronise/custom_online',
                                   'made-by-synchronise/superadmin'),
                        hideNormalFooter: true
                    });
                    assets.navbarButtonsStateReset();
                }else{
                    res.redirect('/dashboard');
                }
            });
        }else{
            res.redirect('/?display=login&backuri=superadmin');
        }
	});
};
