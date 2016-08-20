var loopback = require('loopback');
module.exports = function MeAuditFieldsMixin(Model) {

    console.log('Model.defination.name ', Model.definition);

    Model.defineProperty('_type', {
        type: String,
        length: 50,
        required: true
    });

    Model.defineProperty('_createdBy', {
        type: String,
        length: 50,
        required: true
    });

    Model.defineProperty('_modifiedBy', {
        type: String,
        length: 50,
        required: true
    });

    Model.defineProperty('_createdOn', {
        type: Date,
        required: true
    });

    Model.defineProperty('_modifiedOn', {
        type: Date,
        required: true
    });

    Model.observe('before save', injectAuditFields);
}

function injectAuditFields(ctx, next) {
    //console.log('ctx ',ctx);
    
    console.log('ctx.Model.defination.settings.mixins.MeAuditFieldsMixin ', ctx.Model.definition.settings.mixins.MeAuditFieldsMixin);

    if (!ctx.Model.definition.settings.mixins.MeAuditFieldsMixin) {
        console.log(' EV audit mixins disable ', ctx.Model.modelName);
    }

    console.log('saving model ', ctx.Model.modelName);
    console.log('ctx.options ', ctx.options);
    var context = ctx.options;

    console.log('context.ctx ', context.ctx);
    var cctx = context.ctx || {};
    console.log('cctx ',cctx);
    var remoteUser = cctx.remoteUser || 'system';
    console.log('remortUser ',remoteUser);
     

    var currentDateTime = new Date();

    var protectedfields = ['_type', '_createdBy', '_modifiedBy', '_createdOn', '_modifiedOn'];

    console.log('ctx Instance ', ctx.instance);
    console.log('ctx.data ', ctx.data);

    var postData = ctx.instance || ctx.data;


    console.log('Post data ', postData);

    var currentInstance = ctx.currentInstance;

    console.log('Current Instance ', currentInstance);
    

    console.log('ctx.isNewInstance ', ctx.isNewInstance);
    protectedfields.forEach(function (field) {

        if (currentInstance) {
            postData[field] = currentInstance[field];

        } else {
            delete postData[field];
            if (postData[field]) {

                postData.unsetAttribute(field);

            }
        }

    });


    if (ctx.instance) {
        console.log('is New istance ', ctx.isNewInstance);

        if (ctx.isNewInstance) {
            ctx.instance._type = ctx.Model.definition.name;
            ctx.instance._createdBy = remoteUser;
            ctx.instance._createdOn = currentDateTime;
        }
        ctx.instance._modifiedBy = remoteUser;
        ctx.instance._modifiedOn = currentDateTime;


    } else {
        ctx.data._modifiedBy = remoteUser;
        ctx.data._modifiedOn = currentDateTime;
    }


    next();

}