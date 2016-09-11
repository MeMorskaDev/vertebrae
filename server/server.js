var preboot = require('../common-modules/preboot');
var loopback = require('loopback');
var boot = require('loopback-boot');
var passport = require('../common-modules/passport');
var mergeUtil = require('../common-modules/merge-util');
var path = require('path');
var async = require('async');
var _ = require('lodash');
var options = {
  appRootDir: __dirname,
  appConfigRootDir: __dirname,
  modelsRootDir: __dirname,
  dsRootDir: __dirname,
  mixinDirs: [],
  bootDirs: [],
  clientAppRootDir: '',
  skipConfigurePassport: false
}
options.bootDirs.push(path.join(__dirname, 'boot'));
module.exports.options = options;

var app = module.exports.loopback = loopback();
preboot.injectOptions();

app.locals.apphome = __dirname;
app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};



// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
// boot(app, __dirname, function (err) {
//   if (err) throw err;
//   passportConfig = passport.initPassport(app);
//   //preboot.setSharedCtor(app);
//   if (passportConfig) {
//     passport.configurePassport(app, passportConfig);
//   }
//   // start the server if `$ node server.js`
//   if (require.main === module)
//     app.start();
// });

finalBoot(app,options,function(err){
  if(err) throw err;

  if(require.main === module)
    app.start();
})


module.exports.boot = function serverBoot(appInstance, options, cb) {
  var env = options.env || process.env.NODE_ENV || 'development';

  if (!appInstance.locals.apphome) {
    var msg = 'please set app.locals.apphome in your current application before calling vertebrae boot ';
    console.error(msg);
    process.exit(1);
  }

  async.parallel([
    async.apply(loadClientConfig, options, env),
    async.apply(loadClientModels, options, env),
    async.apply(loadClientDataSource, options, env),
    async.apply(loadClientComponent, options, env),
    async.apply(loadClientMiddleware, options, env)
  ],
    function serverBootAsyncParallelCb(err, results) {
      finalBoot(appInstance, options, cb);
    })

}

function finalBoot(appInstance, options, cb) {
  boot(appInstance, options, function (err) {
    if (err) throw err;

    passportConfig = passport.initPassport(appInstance);
    if (passportConfig) {
      passport.configurePassport(appInstance, passportConfig);
    }
    cb();
  });
}


function loadClientComponent(options, env, cb) {
  var clientComponentConfig = boot.ConfigLoader.loadComponents(options.clientAppRootDir, env);
  var componentConfig = boot.ConfigLoader.loadComponents(__dirname, env);
  var finalComponentConfig = mergeUtil.mergeJSON(componentConfig, clientComponentConfig);
  options.components = finalComponentConfig;
  cb();
}
function loadClientConfig(options, env, cb) {
  var clientConfig = boot.ConfigLoader.loadAppConfig(options.clientAppRootDir, env);
  var config = boot.ConfigLoader.loadAppConfig(__dirname, env);
  var finalConfig = mergeUtil.mergeJSON(config, clientConfig);
  options.config = finalConfig;
  cb();
}

function loadClientDataSource(options, env, cb) {
  var clientDataSources = boot.ConfigLoader.loadDataSources(options.clientAppRootDir, env);
  var dataSources = boot.ConfigLoader.loadDataSources(__dirname, env);
  var finalDataSources = mergeUtil.mergeDataSource(dataSources, clientDataSources);
  options.dataSources = finalDataSources;
  cb();
}

function loadClientModels(options, env, cb) {
  var clientModelConfig = boot.ConfigLoader.loadModels(options.clientAppRootDir, env);
  
  function modifyPath(element) {
    if (element.indexOf('../') === 0)
      return path.relative(options.appRootDir, path.resolve('../', options.clientAppRootDir, element));
    else if (element.indexOf('./') === 0)
      return path.relative(options.appRootDir, path.resolve(options.clientAppRootDir, element));
    else
      return element;
  }

  if (clientModelConfig._meta && clientModelConfig._meta.sources) {
    clientModelConfig._meta.sources = _.map(clientModelConfig._meta.sources, modifyPath);
  }

  if (clientModelConfig._meta && clientModelConfig._meta.mixins) {
    clientModelConfig._meta.mixins = _.map(clientModelConfig._meta.mixins, modifyPath);
  }

  var modelConfig = boot.ConfigLoader.loadModels(__dirname, env);
  var finalModelConfig = mergeUtil.mergeJSON(modelConfig, clientModelConfig);

  options.models = finalModelConfig;

  cb();
}


function loadClientMiddleware(options, env, callback) {

  //change the client path.options.clientAppRootDir
  var relativeServerPath = replaceAll(path.relative(options.appRootDir, options.clientAppRootDir), '\\', '/') + '/';
  var relativePath = replaceAll(path.relative(options.appRootDir, ''), '\\', '/') + '/';

  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()\[\]\/\\])/g, '\\$1');
  }

  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }

  //Load the client middleware files.
  var clientmiddleware = boot.ConfigLoader.loadMiddleware(options.clientAppRootDir, env);
  var temp = '<dummy>';
  if (clientmiddleware) {
    var tempmiddleware = replaceAll(JSON.stringify(clientmiddleware), '../', temp);
    tempmiddleware = replaceAll(tempmiddleware, './', relativeServerPath);
    clientmiddleware = JSON.parse(replaceAll(tempmiddleware, temp, relativePath));
  }
  var middleware = boot.ConfigLoader.loadMiddleware(__dirname, env);
  var finalMiddleware=mergeUtil.mergeObject(middleware, clientmiddleware);
  
  options.middleware = finalMiddleware;
  callback();
}
