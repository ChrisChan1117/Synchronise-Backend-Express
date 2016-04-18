var path          = require('path');
var urlBodyParser = require(path.normalize(__dirname + '/../helpers/urlBodyParser'));
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));
var socketio      = require(path.normalize(__dirname + '/socket-io'));
var FacebookP     = require('passport-facebook').Strategy;
var assets        = require(path.normalize(__dirname + '/../helpers/assets'));
var userH         = require(path.normalize(__dirname + '/../helpers/user'));

exports.login = function(req, res) {
    urlBodyParser.parse(req, res, function(request, response){
        orm.model("User").then(function(User){
            User.login(request.params.email, request.params.password, req).then(function(user){
                response.success({
                    user      : user,
                    user_id   : user.id,
                    authToken : req.sessionID
                });
            }, function(err){
                response.error("Username or password incorrect");
            });
        });
    });
};

exports.logout = function(req, res) {
    orm.model("User").then(function(User){
        var id;
        if(req.session.user){
            id = req.session.user.id;
        }
        User.logout(req, res);
        res.redirect('/');
        if(id){
            socketio.sendPingForDataUpdated("getCurrentSession"+id);
        }
    });
};

exports.loginSocial = function(request, response, next){
    request.session.user = request.user;
    request.session.save();
    response.redirect('/dashboard');

    if(request.session.referral){
        if(!request.user.referral){
            orm.model(["User"]).then(function(d){
                d.User.updateUser({referral: request.session.referral}, request.user);

                d.User.userById(request.session.referral).then(function(referrer){
                    var previousBonus = parseInt(referrer.bonus_requests)+10000;
                    d.User.updateUser({bonus_requests:previousBonus}, referrer);
                });
            });
        }
    }
};

exports.loginSocialError = function(req, res){
    userH.getUserObject(req, function(user){
        var errors = req.flash('error');

        if(errors.length){
            res.render('loginSocialError', {
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                user: user,
                navbarButtonsState: assets.navbarButtonsState,
                title: "Login",
                js: Array(),
                css: Array('made-by-synchronise/custom_online'),
                hideNormalFooter: true,
                errors: errors
            });
        }else{
            res.redirect('/?display=login');
        }
        assets.navbarButtonsStateReset();
    });
};

exports.recover_password = function(req, res){
    userH.getUserObject(req, function(user){
        orm.model(["UserRecoverPassword"]).then(function(d){
            d.UserRecoverPassword.isTokenValid(req.params.token).then(function(valid){
                res.render('recover_password', {
                    url: req.protocol + '://' + req.get('host') + req.originalUrl,
                    user: user,
                    navbarButtonsState: assets.navbarButtonsState,
                    title: "Recover password",
                    js: Array(),
                    css: Array('made-by-synchronise/custom'),
                    hideNormalFooter: true,
                    valid: valid
                });
                assets.navbarButtonsStateReset();
            });
        });
    });
};
