var loopback = require('loopback');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');

module.exports.initPassport = function initPassport(app) {
    // Passport configurators..
    var loopbackPassport = require('loopback-component-passport');
    var PassportConfigurator = loopbackPassport.PassportConfigurator;
    var passportConfigurator = new PassportConfigurator(app);

    return passportConfigurator;
};

module.exports.configurePassport = function configurePassport(app, passportConfigurator) {

    // configure body parser
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.middleware('auth', app.loopback.token({
        model: app.models.AuthSession,
        currentUserLiteral: 'me'
    }));

    // Providers.json will now be looked only from app if app is using ev foundation, if ev foundation is directly run as app, then it will be picked up from ev foundation (so app will not fallback on evfoundation to avoid by chance picking unintentional configuration)
    //app.locals.apphome
    var config = {};
    var providerConfig = path.join(app.locals.apphome, 'providers.json');
    try {
        config = require(providerConfig);
    } catch (err) {
        console.error('could not load login configuration ', providerConfig);
        console.error('https://docs.strongloop.com/display/public/LB/Configuring+providers.json');
        console.error(err);
        process.exit(1); // fatal
    }

    var flash = require('express-flash');

    //boot(app, __dirname);
    //app.emit('ready');
    // to support JSON-encoded bodies
    app.middleware('parse', bodyParser.json());
    // to support URL-encoded bodies
    app.middleware('parse', bodyParser.urlencoded({
        extended: true
    }));

    app.middleware('session:before', cookieParser(app.get('cookieSecret')));

    passportConfigurator.init();

    // We need flash messages to see passport errors
    app.use(flash());
    var BaseUser = loopback.getModelByType('BaseUser');
    passportConfigurator.setupModels({
        userModel: BaseUser, //app.models.user,
        userIdentityModel: app.models.userIdentity,
        userCredentialModel: app.models.userCredential
    });
    for (var s in config) {
        if (config.hasOwnProperty(s)) {
            var c = config[s];
            c.session = c.session !== false;
            passportConfigurator.configureProvider(s, c);
        }
    }
};

