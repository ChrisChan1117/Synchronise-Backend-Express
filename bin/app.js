var dev = true;
var path         = require('path');
var flash        = require('connect-flash');
var express      = require('express');
var compression  = require('compression');
var app          = express();
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser')();
var cors         = require('cors')();
var session      = require('express-session');
var sitemap      = require('express-sitemap');
var assets       = require(path.normalize(__dirname + '/../helpers/assets'));
var orm          = require(path.normalize(__dirname + '/../helpers/orm'));
var passport     = require('passport');
var FacebookP    = require('passport-facebook').Strategy;
var RedisStore   = require('connect-redis')(session);
    RedisStore   = new RedisStore({
        client: assets.redisSessionStore
    });

// Helpers
global.Promise   = require('promise');
global._         = require('underscore');

// Include all the controllers for the routes
var offlineR     = require(path.normalize(__dirname + '/../routes/offline'));
var userR        = require(path.normalize(__dirname + '/../routes/user'));
var billingR     = require(path.normalize(__dirname + '/../routes/billing'));
var dashboardR   = require(path.normalize(__dirname + '/../routes/dashboard'));
var connectR     = require(path.normalize(__dirname + '/../routes/connect'));
var projectR     = require(path.normalize(__dirname + '/../routes/project'));
var emailR       = require(path.normalize(__dirname + '/../routes/email'));
var sadminR      = require(path.normalize(__dirname + '/../routes/superadmin'));
var compR        = require(path.normalize(__dirname + '/../routes/component'));
var workFlowR    = require(path.normalize(__dirname + '/../routes/workflow'));
var logsR        = require(path.normalize(__dirname + '/../routes/logs'));
var marketplaceR = require(path.normalize(__dirname + '/../routes/marketplace'));

// Include user backend for routes association with passeport.js
var userB        = require(path.normalize(__dirname + '/../backend/user'));

// !!!!!!!!!! CONFIGURATION !!!!!!!!!!

// Global app configuration section
app.use(cookieParser);
app.set('views', 'views'); // Specify the folder to find templates
app.set('view engine', 'ejs'); // Set the template engine
app.use(express.static(path.normalize(__dirname + '/../public')));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(userB.passport.initialize());
app.set('trust proxy', 1);

var sessionInstance = session({
    store            : RedisStore,
    key              : 'synchroniseio.sid',
    secret           : assets.redisSessionStoreCredentials.secret,
    resave           : false,
    saveUninitialized: true,
    genid            : function(req) {
        var date = new Date();
        return assets.randomString(10)+date.getTime();
    },
    name             : 'synchroniseio.sid',
    cookie           : { secure: false }
});

app.use(sessionInstance);
app.use(flash());
app.use(cors);

// !!!!!!!!!! ROUTES !!!!!!!!
// Just a random route, typically used to ping to see if the server is running
app.get('/dummy', function(req, res){
    res.status(200);
    res.end("");
});

// EMAIL ROUTES
app.get('/email/choose_password', emailR.choose_password);
app.get('/email/password_updated', emailR.password_updated);
app.get('/email/email_verified', emailR.email_verified);
app.get('/email/invalid_link', emailR.invalid_link);

// OFFLINE ROUTES
app.get('/', offlineR.home);
app.get('/docs', offlineR.docs);
app.get('/about', offlineR.about);
app.get('/help', offlineR.help);
app.get('/jobs', offlineR.jobs);
app.get('/license', offlineR.licence);
app.get('/sdk/:sdk', offlineR.sdks); // Example: /sdk/arduino

// MARKET PLACE
app.get('/marketplace', marketplaceR.home);
app.get('/marketplace/project/:id', marketplaceR.project);

// USERS ROUTES
app.post("/login", userR.login);
app.get("/logout", userR.logout);
app.get("/recover_password/:token", userR.recover_password);

// SOCIAL LOGIN
app.get('/loginSocial', userR.loginSocialError);

app.get('/auth/facebook', userB.passport.authenticate('facebook',{scope:['email'], failureFlash: true, failureRedirect: '/loginSocial'}));
app.get('/auth/facebook/callback', userB.passport.authenticate('facebook', {failureFlash: true, failureRedirect: '/loginSocial'}), userR.loginSocial);

app.get('/auth/github', userB.passport.authenticate('github',{scope:['user:email'], failureFlash: true, failureRedirect: '/loginSocial'}));
app.get('/auth/github/callback', userB.passport.authenticate('github', {failureFlash: true, failureRedirect: '/loginSocial'}), userR.loginSocial);

app.get('/auth/bitbucket', userB.passport.authenticate('bitbucket',{scope:['email'], failureFlash: true, failureRedirect: '/loginSocial'}));
app.get('/auth/bitbucket/callback', userB.passport.authenticate('bitbucket', {failureFlash: true, failureRedirect: '/loginSocial'}), userR.loginSocial);

app.get('/auth/google', userB.passport.authenticate('google',{scope: ['email', 'profile'], failureFlash: true, failureRedirect: '/loginSocial'}));
app.get('/auth/google/callback', userB.passport.authenticate('google', {failureFlash: true, failureRedirect: '/loginSocial'}), userR.loginSocial);


// DASHBOARD ROUTES
app.get("/dashboard", dashboardR.home);

// CONNECT
app.get("/connect", connectR.home);

// PROJECTS
app.get("/project", projectR.home);
app.get("/project/contribute/:id_project", projectR.contribute);

// BILLING ROUTES
app.get("/billing", billingR.home);
app.get("/billing/invoice", billingR.invoice);

// COMPONENTS ROUTES
app.get("/component", compR.home);
app.get("/component/edit", compR.edit);
app.post("/component/run", compR.execute);
app.get("/component/clone/:id", compR.cloneComponent);

// WORKFLOW ROUTES
app.get("/workflow", workFlowR.home);
app.get("/workflow/edit", workFlowR.edit);
app.post("/workflow/run", workFlowR.execute);

// LOGS - Not implementeed
app.get("/logs", logsR.home);
app.get("/logs/section", logsR.section);

// SUPERADMIN ROUTES
app.get('/superadmin', sadminR.home);

// Flash message
app.get('/flash', function(req, res){
  res.redirect('/');
});

// Generates a sitemap of the project
app.get('/sitemap', function(req, res){
    sitemap({
        url: 'www.synchronise.io',
        http: 'https',
        cache: 86400000,
        map: {
            '/docs': ['get'],
            '/about': ['get'],
            '/help': ['get'],
            '/jobs': ['get'],
            '/license': ['get']
        }
    }).XMLtoWeb(res);
});

// Generates a sitemap of the project available on the marketplace
app.get('/sitemap/marketplace', marketplaceR.sitemap);

// 404
app.get('*', offlineR.notFound);

app.sessionStore   = RedisStore;
app.cookieParser   = cookieParser;
app.sessionInstance = sessionInstance;
module.exports = app;
