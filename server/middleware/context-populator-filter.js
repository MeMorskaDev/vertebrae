var loopback = require('loopback');
var LoopbackContext = require('loopback-context');

//var log = require('../../ev-modules/ev-logger')('context-populator-filter');
/**
 * Context Populator Filter
 * This middleware sets the current Context from req to loopback current context
 * There is a bug in loopback passport component that if session is used
 * then current context is lost after session layer handles the request
 * so it is possible to call this middleware in each of layer
 * so that callContext which is populated in pre-auth-context-populator
 * middleware can be set into loopback current context.
 * If you want to use session then this middleware needs to be configured
 * in each of phases in middleware.json.
 *
 * @name Context Populator Filter
 * @memberof Middleware
 */

module.exports = function ContextPopulatorFilter(options) {

    return function populateContext(req, res, next) {
        if (req.callContext) {
            var loopbackContext = LoopbackContext.getCurrentContext();
            if (loopbackContext) {
                loopbackContext.set('callContext', req.callContext);
               // log.debug('context set = ' , JSON.stringify(req.callContext));
            } else {
                throw (new Error('call context is null'));
            }

          
        }
        next();
    };
};
