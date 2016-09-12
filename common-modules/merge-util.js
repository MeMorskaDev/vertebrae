var _ = require('lodash');

// module.exports.mergeModelConfing = function mergeModelConfing(modelConfig, clientModelConfig) {

//     for (var key in clientModelConfig) {
//         if (clientModelConfig.hasOwnProperty(key)) {
//             if (key === '_meta') {
//                 if (clientModelConfig._meta.sources)
//                     modelConfig._meta.sources = _.union(clientModelConfig._meta.sources, modelConfig._meta.sources);
//                 if (clientModelConfig._meta.mixins)
//                     modelConfig._meta.mixins = _.union(clientModelConfig._meta.mixins, modelConfig._meta.mixins);
//             } else {
//                 modelConfig[key] = clientModelConfig[key];
//             }
//         }
//     }

//     return modelConfig;

// }

module.exports.mergeDataSource = function mergeDataSource(dataSources, clientDataSources) {
    _.extend(dataSources, clientDataSources);
    return dataSources;
}

module.exports.mergeJSON = function mergeJSON(target, source) {
    mergeObject(target, source)
    return target;
}

function mergeObject(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === "object") {
                if (typeof target[key] === 'undefined') {
                    target[key] = source[key];
                } else if (source[key] instanceof Array) {
                    target[key] = _.union(target[key], source[key]);
                }
                else {
                    mergeObject(target[key], source[key]);
                }
            } else {
                target[key] = source[key];
            }

        }
    }
}


// module.exports.mergeMiddlewareConfig = function mergeMiddlewareConfig(target, config, fileName) {
//     var err;
//     for (var phase in config) {
//         if (config.hasOwnProperty(phase)) {
//             if (phase in target) {
//                 err = mergePhaseConfig(target[phase], config[phase], phase);
//             } else {
//                 err = 'The phase "' + phase + '" is not defined in the main config.';
//             }
//             if (err) {
//                 throw new Error('Cannot apply ' + fileName + ': ' + err);
//             }
//         }
//     }
// };

// function mergeNamedItems(arr1, arr2, key) {
//     assert(Array.isArray(arr1), 'invalid array: ' + arr1);
//     assert(Array.isArray(arr2), 'invalid array: ' + arr2);
//     key = key || 'name';
//     var result = [].concat(arr1);
//     for (var i = 0, n = arr2.length; i < n; i++) {
//         var item = arr2[i];
//         var found = false;
//         if (item[key]) {
//             for (var j = 0, k = result.length; j < k; j++) {
//                 if (result[j][key] === item[key]) {
//                     mergeObjects(result[j], item);
//                     found = true;
//                     break;
//                 }
//             }
//         }
//         if (!found) {
//             result.push(item);
//         }
//     }
//     return result;
// }

// function mergePhaseConfig(target, config, phase) {
//     var err;
//     var targetMiddleware;
//     var configMiddleware;
//     for (var mw in config) {
//         if (config.hasOwnProperty(mw)) {
//             if (mw in target) {
//                 targetMiddleware = target[mw];
//                 configMiddleware = config[mw];
//                 if (Array.isArray(targetMiddleware) && Array.isArray(configMiddleware)) {
//                     // Both are arrays, combine them
//                     target[mw] = mergeNamedItems(targetMiddleware, configMiddleware);
//                 } else if (Array.isArray(targetMiddleware)) {
//                     if (typeof configMiddleware === 'object' &&
//                         Object.keys(configMiddleware).length) {
//                         // Config side is an non-empty object
//                         target[mw] = mergeNamedItems(targetMiddleware, [configMiddleware]);
//                     }
//                 } else if (Array.isArray(configMiddleware)) {
//                     if (typeof targetMiddleware === 'object' &&
//                         Object.keys(targetMiddleware).length) {
//                         // Target side is an non-empty object
//                         target[mw] = mergeNamedItems([targetMiddleware], configMiddleware);
//                     } else {
//                         // Target side is empty
//                         target[mw] = configMiddleware;
//                     }
//                 } else {
//                     err = mergeObjects(targetMiddleware, configMiddleware);
//                 }
//             } else {
//                 //entry is not in target.
//                 targetMiddleware = {};
//                 targetMiddleware[mw] = {};
//                 configMiddleware = config[mw];
//                 if (Array.isArray(configMiddleware)) {
//                     if (typeof targetMiddleware === 'object' &&
//                         Object.keys(targetMiddleware).length) {
//                         // Target side is an non-empty object
//                         target[mw] = mergeNamedItems([targetMiddleware], configMiddleware);
//                     } else {
//                         // Target side is empty
//                         target[mw] = configMiddleware;
//                     }
//                 } else {
//                     target[mw] = configMiddleware;
//                 }
//                 // err = 'The middleware "' + mw + '" in phase "' + phase + '"' +
//                 //     'is not defined in the main config.';
//             }
//             if (err) {
//                 return err;
//             }
//         }
//     }
// }


// function mergeObjects(target, config, keyPrefix) {
//     for (var key in config) {
//         if (config.hasOwnProperty(key)) {
//             var fullKey = keyPrefix ? keyPrefix + '.' + key : key;
//             var err = mergeSingleItemOrProperty(target, config, key, fullKey);
//             if (err) {
//                 return err;
//             }
//         }
//     }
//     return null; // no error
// }

// function mergeSingleItemOrProperty(target, config, key, fullKey) {
//     var origValue = target[key];
//     var newValue = config[key];

//     if (!hasCompatibleType(origValue, newValue)) {
//         return 'Cannot merge values of incompatible types for the option `' +
//             fullKey + '`.';
//     }

//     if (Array.isArray(origValue)) {
//         return mergeArrays(origValue, newValue, fullKey);
//     }

//     if (newValue !== null && typeof origValue === 'object') {
//         return mergeObjects(origValue, newValue, fullKey);
//     }

//     target[key] = newValue;
//     return null; // no error
// }

// function mergeArrays(target, config) {
//     //if (target.length !== config.length) {
//     //kishore : call only this for merge
//     return mergeArraysDiffLength(target, config);
//     //}

//     // Use for(;;) to iterate over undefined items, for(in) would skip them.
//     // for (var ix = 0; ix < target.length; ix++) {
//     //     var fullKey = keyPrefix + '[' + ix + ']';
//     //     var err = mergeSingleItemOrProperty(target, config, ix, fullKey);
//     //     if (err) {
//     //         return err;
//     //     }
//     // }

//     //return null; // no error
// }

// function mergeArraysDiffLength(target, config) {
//     var newTarget = _.cloneDeep(target, true);
//     // Union of both the target and config arrays.
//     var union = _.union(newTarget, config);
//     // Modifies the target array with the union.
//     Array.prototype.splice.apply(target, [0, target.length].concat(union));
// }

// function hasCompatibleType(origValue, newValue) {
//     if (origValue === null || origValue === undefined) {
//         return true;
//     }

//     if (Array.isArray(origValue)) {
//         return Array.isArray(newValue);
//     }

//     if (typeof origValue === 'object') {
//         return typeof newValue === 'object';
//     }

//     // Note: typeof Array() is 'object' too,
//     // we don't need to explicitly check array types
//     return typeof newValue !== 'object';
// }