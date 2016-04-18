var path        = require('path');
var assets      = require(path.normalize(__dirname + '/../helpers/assets'));
var userH       = require(path.normalize(__dirname + '/../helpers/user'));
var orm         = require(path.normalize(__dirname + '/../helpers/orm'));
var Synchronise = require("synchronise")(assets.SYNCHRONISEAPIKEY);

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
        if(user){
            res.redirect('/dashboard');
        }else{
            req.session.referral = req.query.referral;
            req.session.save();

            assets.navbarButtonsState.home = 'active';

            res.render('home', {
                title: "Synchronise - Cloud Computing",
                description: "Create and reuse cloud components in node.js: cloud drive, cloud printing, newsletter, email",
                user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                path: req.path,
                navbarButtonsState: assets.navbarButtonsState,
                hideNormalFooter: true,
                displayMenu: false,
                js: Array(
                    'pages/homePlugins',
                    'pages/home'
                ),
                css: Array()
            });
            assets.navbarButtonsStateReset();
        }
    });
};

exports.jobs = function(req, res) {
    userH.getUserObject(req, function(user){
        assets.navbarButtonsState.jobs = 'active';

        res.render('jobs', {
            user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            navbarButtonsState: assets.navbarButtonsState,
            title: "Jobs Synchronise",
            description: "Software developer internship iOS, Android, Node.JS, React.JS, .Net, Windows Phone, PHP, Ruby",
            js: Array(),
            css: Array('made-by-synchronise/custom')
        });
        assets.navbarButtonsStateReset();
    });
};

exports.pricing = function(req, res) {
    userH.getUserObject(req, function(user){
        assets.navbarButtonsState.pricing = 'active';

        res.render('pricing', {
            user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            navbarButtonsState: assets.navbarButtonsState,
            title: "Pricing | Synchronise",
            description: "",
            hideNormalFooter: true,
            js: Array(
                'pages/pricing'
            ),
            css: Array(
                'made-by-synchronise/custom',
                'made-by-synchronise/pricing'
            )
        });
        assets.navbarButtonsStateReset();
    });
};

exports.features = function(req, res) {
    res.redirect('/');
};

exports.docs = function(req, res) {
    res.redirect('https://docs.synchronise.io');
};

exports.help = function(req, res) {
    res.redirect('https://disqus.com/home/forum/synchronise/');
};

exports.blog = function(req, res) {
    userH.getUserObject(req, function(user){
        assets.navbarButtonsState.blog = 'active';
        res.render('blog', {
            user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            title: "Blog Synchronise",
            description: "Newsletter and blog about dev iOS, Android, Node.JS, React.JS, .Net",
            navbarButtonsState: assets.navbarButtonsState,
            js: Array(),
            css: Array('made-by-synchronise/custom',
                       'made-by-synchronise/blog')
                   });
                   assets.navbarButtonsStateReset();
               });
};

exports.about = function(req, res) {
    userH.getUserObject(req, function(user){
        assets.navbarButtonsState.about = 'active';
        res.render('about', {
            user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            navbarButtonsState: assets.navbarButtonsState,
            title: "Team Synchronise",
            description: "Discover the team behing the ground breaking cloud platform for iOS, Android, Node.JS, Javascript, .Net",
            js: Array(),
            css: Array('made-by-synchronise/custom',
                       'made-by-synchronise/about')
                   });
        assets.navbarButtonsStateReset();
    });
};

exports.legal = function(req, res) {
    userH.getUserObject(req, function(user){
        res.render('legal', {
            user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            navbarButtonsState: assets.navbarButtonsState,
            title: "Legal - Contact - Address",
            decription: "Synchronise company number email address",
            js: Array(),
            css: Array('made-by-synchronise/custom')
        });
        assets.navbarButtonsStateReset();
    });
};

exports.licence = function(req, res) {
    userH.getUserObject(req, function(user){
        res.render('license', {
            user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            navbarButtonsState: assets.navbarButtonsState,
            title: "Licenses",
            description: "List of the licenses of the third party libraries used in Synchronise",
            js: Array(),
            css: Array(
                'made-by-synchronise/custom',
                'made-by-synchronise/license'
            )
        });
        assets.navbarButtonsStateReset();
    });
};

exports.notFound = function(req, res) {
    switch (req.headers.host) {
        case "synchronise.io":
        case "www.synchronise.io":
        case "localhost:3001":
            userH.getUserObject(req, function(user){
                res.render('notFound', {
                    user: user,
                    url: req.protocol + '://' + req.get('host') + req.originalUrl,
                    navbarButtonsState: assets.navbarButtonsState,
                    title: "404 Not found",
                    description: "You have reached an unknown page",
                    js: Array(),
                    css: Array('made-by-synchronise/custom')
                });
                assets.navbarButtonsStateReset();
            });
            break;
        default:
            res.redirect("https://www.synchronise.io");
    }
};

exports.skypeCall = function(req, res){
    res.redirect("skype:synchroniseio?chat");
};

exports.sdks = function(req, res) {
    var title = "";
    var description = "";

    switch (req.params.sdk) {
        case "arduino":
            title = "Connect your Arduino to the Web | Synchronise";
            description = "Arduino communicate facebook twitter uber mail sms database";
            break;
    }

    userH.getUserObject(req, function(user){
        res.render('sdks/'+req.params.sdk, {
            user: user,
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            navbarButtonsState: assets.navbarButtonsState,
            title: title,
            description: description,
            hideNormalFooter: true,
            js: Array(
                'pages/sdks'
            ),
            css: Array(
                'made-by-synchronise/custom',
                'made-by-synchronise/sdks'
            )
        });
        assets.navbarButtonsStateReset();
    });
};
