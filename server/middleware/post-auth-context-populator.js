//var log = require('../../ev-modules/ev-logger')('context-populator-filter');
var camelCase = require('camelcase');
var loopback = require('loopback');

/**
 * This middleware sets callContext based on logged in user
 * This is run post authorization
 * @name Post Auth Context Populator
 */

module.exports = function postAuthContextPopulator(options) {

    var excludeList = ['id', 'ttl', 'created'];

    return function setRequestContext(req, res, next) {
         var loopbackContext = loopback.getCurrentContext();
        console.log('loopbackContext ',loopbackContext);
        if (req.accessToken) {
            var callContext = req.callContext || {};
            callContext.ctx = callContext.ctx || {};

            var instance = req.accessToken.__data;
            if (instance) {
                var keys = Object.keys(instance);
                keys.map(function(key, index) {
                    if (excludeList.indexOf(key) === -1) {
                        // TODO will put generic check for Array
                        if (key === 'roles') {
                            callContext.ctx[camelCase(key)] = JSON.parse(JSON.stringify(instance[key]));
                        } else {
                            callContext.ctx[camelCase(key)] = instance[key];
                        }
                    }
                });
            }

            callContext.ctx.remoteUser = req.accessToken.username;

            // Object.keys(callContext.ctx).map(function(key, index) {
            //     callContext.ctxWeights[key] = callContext.ctxWeights[key] || '0';
            // });

            req.callContext = callContext;

            console.log('Inside postauth context ', req.callContext);
           // log.debug('postAuthContextPopulator : context setting as  = ' , JSON.stringify(callContext));

        }
        next();
    };
};
