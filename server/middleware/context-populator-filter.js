var loopback = require('loopback');

module.exports = function ContextPopulatorFilter(options) {
    
    return function populatecontext(req,res,next) {
        
        if(req.callContext){
            var loopbackContext = loopback.getCurrentContext();

            if(loopbackContext){
                loopbackContext.set('callContext',req.callContext);
                console.log('context set ',JSON.stringify(req.callContext));
            }
            else{
                return next('Call context is null');
            }
        }

        next();
    }
}