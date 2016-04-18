var path   = require('path');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));

exports.choose_password = function(req, res) {
    res.render('email/choose_password', {
        navbarButtonsState: assets.navbarButtonsState,
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        js: Array(),
        css: Array('made-by-synchronise/custom',
                   'made-by-synchronise/email')
    });
};

exports.password_updated = function(req, res) {
    res.render('email/password_updated', {
        navbarButtonsState: assets.navbarButtonsState,
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        js: Array(),
        css: Array('made-by-synchronise/custom',
                   'made-by-synchronise/email')
    });
};

exports.email_verified = function(req, res) {
    res.render('email/email_verified', {
        navbarButtonsState: assets.navbarButtonsState,
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        js: Array(),
        css: Array('made-by-synchronise/custom',
                   'made-by-synchronise/email')
    });
};

exports.invalid_link = function(req, res) {
    res.render('email/invalid_link', {
        navbarButtonsState: assets.navbarButtonsState,
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        js: Array(),
        css: Array('made-by-synchronise/custom',
                   'made-by-synchronise/email')
    });
};
