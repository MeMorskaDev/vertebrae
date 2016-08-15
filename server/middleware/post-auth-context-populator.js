

module.exports = function postAuthContextPopulator(options) {
    
    var excludeList= ['id','ttl','created'] ;

    return function setRequestContext(req,res,next) {
        //console.log('req ----------------  ',JSON.stringify(req) )
        console.log('res ---------------------- ' ,JSON.stringify(res.body));
        if(req.accessToken){
            var callContext = req.callContext || {};
            callContext.ctx = callContext.ctx || {};

            callContext.ctx.remortUser= req.accessToken.username;

            req.callContext = callContext;
        }

        next();
    }
}