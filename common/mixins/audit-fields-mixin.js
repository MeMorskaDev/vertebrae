var log = require('../../common-modules/logger')('me-audit-fields-mixin');
var loopback = require('loopback');
var LoopbackContext = require('loopback-context');

module.exports = function AuditFieldsMixin(Model) {

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
    log.debug(' Inside inject audit Fields ',ctx.Model.modelName);
    if (!ctx.Model.definition.settings.mixins.AuditFieldsMixin) {
        log.debug(' EV audit mixins disable ', ctx.Model.modelName);
        return next();
    }

    var context = ctx.options;
    var cctx = context.ctx || {};
    var remoteUser = cctx.remoteUser || 'system';
     
    var currentDateTime = new Date();

    var protectedfields = ['_type', '_createdBy', '_modifiedBy', '_createdOn', '_modifiedOn'];

    var postData = ctx.instance || ctx.data;

    var currentInstance = ctx.currentInstance;
    
    // protectedfields.forEach(function (field) {

    //     if (currentInstance) {
    //         postData[field] = currentInstance[field];

    //     } else {
    //         delete postData[field];
    //         if (postData[field]) {

    //             postData.unsetAttribute(field);

    //         }
    //     }

    // });


    if (ctx.instance) {

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