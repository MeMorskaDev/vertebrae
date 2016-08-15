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
    console.log('ctx ',ctx);
    
    console.log('ctx.Model.defination.settings.mixins.MeAuditFieldsMixin ', ctx.Model.definition.settings.mixins.MeAuditFieldsMixin);

    if (!ctx.Model.definition.settings.mixins.MeAuditFieldsMixin) {
        console.log(' EV audit mixins disable ', ctx.Model.modelName);
    }

    console.log('saving model ', ctx.Model.modelName);
    console.log('ctx.options ', ctx.options);
    var context = ctx.options;

    console.log('context.ctx ', context.ctx);
    var cctx = context.ctx || {};

    var remortUser = cctx.remortUser || 'system';
    console.log('remortUser ',remortUser);
    
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
            ctx.instance._createdBy = remortUser;
            ctx.instance._createdOn = currentDateTime;
        }
        ctx.instance._modifiedBy = remortUser;
        ctx.instance._modifiedOn = currentDateTime;


    } else {
        ctx.data._modifiedBy = remortUser;
        ctx.data._modifiedOn = currentDateTime;
    }


    next();

}