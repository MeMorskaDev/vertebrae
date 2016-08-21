
var SharedClass = require('../node_modules/loopback/node_modules/strong-remoting').SharedClass;
var SharedMethod = require('../node_modules/loopback/node_modules/strong-remoting/lib/shared-method');
var debug = require('debug')('strong-remoting:shared-method');
//var traverse = require('traverse');
//var assert = require('assert');
var util = require('util');

// this file can load all modules which need to be customized
// or monkey patched for EVF

function hasOptions(accepts) {
    if (Array.isArray(accepts)) {
        for (var i = 0; i < accepts.length; i++) {
            var argDesc = accepts[i];
            if (argDesc.arg === 'options') {
                return true;
            }
        }
    } else {
        return accepts.arg === 'options';
    }
}

function BadArgumentError(msg) {
    var err = new Error(msg);
    err.statusCode = 400;
    return err;
}

/**
 * Coerce an 'accepts' value into its final type.
 * If using HTTP, some coercion is already done in http-context.
 *
 * This should only do very simple coercion.
 *
 * @param  {*} uarg            Argument value.
 * @param  {Object} desc       Argument description.
 * @return {*}                 Coerced argument.
 */
function coerceAccepts(uarg, desc) {
    var name = desc.name || desc.arg;
    var targetType = convertToBasicRemotingType(desc.type);
    var targetTypeIsArray = Array.isArray(targetType) && targetType.length === 1;

    // If coercing an array to an erray,
    // then coerce all members of the array too
    if (targetTypeIsArray && Array.isArray(uarg)) {
        return uarg.map(function(arg, ix) {
            // when coercing array items, use only name and type,
            // ignore all other root settings like "required"
            return coerceAccepts(arg, {
                name: name + '[' + ix + ']',
                type: targetType[0]
            });
        });
    }

    var actualType = SharedMethod.getType(uarg);

    // convert values to the correct type
    // TODO(bajtos) Move conversions to HttpContext (and friends)
    // SharedMethod should only check that argument values match argument types.
    var conversionNeeded = targetType !== 'any' &&
      actualType !== 'undefined' &&
      actualType !== targetType;

    if (conversionNeeded) {
        // JSON.parse can throw, so catch this error.
        try {
            uarg = convertValueToTargetType(name, uarg, targetType);
            actualType = SharedMethod.getType(uarg);
        } catch (e) {
            var message = util.format('invalid value for argument \'%s\' of type ' +
              '\'%s\': %s. Received type was %s. Error: %s',
              name, targetType, uarg, typeof uarg, e.message);
            throw new BadArgumentError(message);
        }
    }

    var typeMismatch = targetType !== 'any' &&
      actualType !== 'undefined' &&
      targetType !== actualType &&
      // In JavaScript, an array is an object too (typeof [] === 'object').
      // However, SharedMethod.getType([]) returns 'array' instead of 'object'.
      // We must explicitly allow assignment of an array value to an argument
      // of type 'object'.
      !(targetType === 'object' && actualType === 'array');

    if (typeMismatch) {
        var message1 = util.format('Invalid value for argument \'%s\' of type ' +
          '\'%s\': %s. Received type was converted to %s.',
          name, targetType, uarg, typeof uarg);
        throw new BadArgumentError(message1);
    }

    // Verify that a required argument has a value
    // FIXME(bajtos) "null" should be treated as no value too
    if (actualType === 'undefined') {
        if (desc.required) {
            throw new BadArgumentError(name + ' is a required arg');
        } else {
            return undefined;
        }
    }

    if (actualType === 'number' && Number.isNaN(uarg)) {
        throw new BadArgumentError(name + ' must be a number');
    }

    return uarg;
}

/**
 * Returns an appropriate type based on a type specifier from remoting
 * metadata.
 * @param {Object} type A type specifier from remoting metadata,
 *    e.g. "[Number]" or "MyModel" from `accepts[0].type`.
 * @returns {String} A type name compatible with the values returned by
 *   `SharedMethod.getType()`, e.g. "string" or "array".
 */
function convertToBasicRemotingType(type) {
    if (Array.isArray(type)) {
        return type.map(convertToBasicRemotingType);
    }

    if (typeof type === 'object') {
        type = type.modelName || type.name;
    }

    type = String(type).toLowerCase();

    switch (type) {
    case 'string':
    case 'number':
    case 'date':
    case 'boolean':
    case 'buffer':
    case 'object':
    case 'file':
    case 'any':
        return type;
    case 'array':
        return ['any'].map(convertToBasicRemotingType);
    default:
        // custom types like MyModel
        return 'object';
}
}

function convertValueToTargetType(argName, value, targetType) {
    switch (targetType) {
    case 'string':
        return String(value).valueOf();
    case 'date':
        return new Date(value);
    case 'number':
        return Number(value).valueOf();
    case 'boolean':
        return Boolean(value).valueOf();
    // Other types such as 'object', 'array',
    // ModelClass, ['string'], or [ModelClass]
    default:
        switch (typeof value) {
        case 'string':
            return JSON.parse(value);
        case 'object':
            return value;
        default:
            throw new BadArgumentError(argName + ' must be ' + targetType);
    }
}
}

var injectOptions = function injectOptions() {

    
    SharedMethod.prototype.invoke = function(scope, args, remotingOptions, ctx, cb) {

        var accepts = this.accepts;
        var returns = this.returns;
        var method = this.getFunction();
        var sharedMethod = this;
        var formattedArgs = [];

        if (typeof ctx === 'function') {
            cb = ctx;
            ctx = undefined;
        }

        if (cb === undefined && typeof remotingOptions === 'function') {
            cb = remotingOptions;
            remotingOptions = {};
        }

        // map the given arg data in order they are expected in
        if (accepts) {
            for (var i = 0; i < accepts.length; i++) {
                var desc = accepts[i];
                var name = desc.name || desc.arg;
                var uarg = SharedMethod.convertArg(desc, args[name]);

                try {
                    uarg = coerceAccepts(uarg, desc, name);
                } catch (e) {
                    //console.log('- %s - ' + e.message, sharedMethod.name);
                    return cb(e);
                }
                // Add the argument even if it's undefined to stick with the accepts
                formattedArgs.push(uarg);
            }
        }

        // define the callback
        function callback(err) {
            if (err) {
                return cb(err);
            }
            // args without err
            var rawArgs = [].slice.call(arguments, 1);
            var result = SharedMethod.toResult(returns, rawArgs, ctx);

            debug('- %s - result %j', sharedMethod.name, result);

            cb(null, result);
        }

        var injectedOptions = ctx.req.callContext || {ctx: {}};
        injectedOptions.restContext = true;
        formattedArgs.push(injectedOptions);

        // add in the required callback
        formattedArgs.push(callback);

        // invoke
        try {
            var retval = method.apply(scope, formattedArgs);
            if (retval && typeof retval.then === 'function') {
                return retval.then(
                  function(args) {
                    if (returns.length === 1) {
                        args = [args];
                    }
                    var result = SharedMethod.toResult(returns, args);
                    debug('- %s - promise result %j', sharedMethod.name, result);
                    cb(null, result);
                },
                  cb // error handler
                );
            }
            return retval;
        } catch (err) {
            debug('error caught during the invocation of %s', this.name);
            return cb(err);
        }
    };

};

// not using this approach for now as this displays
// options in swagger also, basically options get exposed
// to client api also
// var injectOptions2 = function injectOptions2() {
//     // loopback juggler already accesspts options as arguments for
//     // all standard remote methods
//     // however when defining rempte method, loopback PersistedModel is not
//     // defining this argument, so this argument can not be passed from
//     // before remote methods (app or model level)
//     // This can also be used to minimised the usage of
//     // loopback context
//     var oldDefineMethod = SharedClass.prototype.defineMethod;
//     var newDefineMethod = function(name, options, fn) {
//         var optionsArgument = {
//             arg: 'options',
//             type: 'object',
//             injectOptions: true
//         };
//         if (options.accepts && !hasOptions(options.accepts)) {
//             if (Array.isArray(options.accepts)) {
//                 options.accepts.push(optionsArgument);
//             } else {
//                 var orgArguments = options.accepts;
//                 options.accepts = [];
//                 options.accepts.push(orgArguments);
//                 options.accepts.push(optionsArgument);
//             }
//         }
//         oldDefineMethod.apply(this, arguments);
//     };
//     SharedClass.prototype.defineMethod = newDefineMethod;
// };

var setSharedCtor = function(appinstance) {
    appinstance.on('modelRemoted', function(sharedClass) {
        sharedClass.sharedCtor.fn = function(data, id, options, fn) {
            var ModelCtor = this;
            if (id === undefined && fn === undefined && options === undefined) {
                if (typeof data === 'function') {
                    fn = data;
                    data = null;
                    id = null;
                    options = {};
                }
            } else if (fn === undefined && options === undefined) {
                if (typeof id === 'function') {
                    fn = id;
                    data = null;
                    id = data;
                    options = {};
                }
            } else if (fn === undefined) {
                if (typeof options === 'function') {
                    fn = options;
                    options = id;
                    id = data;
                    data = null;
                } else {
                    data = null;
                }
            }

            if (id && data) {
                var model = new ModelCtor(data);
                model.id = id;
                fn(null, model);
            } else if (data) {
                fn(null, new ModelCtor(data));
            } else if (id) {
                ModelCtor.findById(id, options, function(err, model) {
                    if (err) {
                        fn(err);
                    } else if (model) {
                        fn(null, model);
                    } else {
                        err = new Error('could not find a model with id ' + id);
                        err.statusCode = 404;
                        err.code = 'MODEL_NOT_FOUND';
                        fn(err);
                    }
                });
            } else {
                fn(new Error('must specify an id or data'));
            }

        };
    });
};

module.exports = {injectOptions: injectOptions, setSharedCtor: setSharedCtor};
