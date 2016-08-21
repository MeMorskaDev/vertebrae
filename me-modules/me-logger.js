var logConfig = require('../server/log-config');
var bunyan = require('bunyan');

module.exports = function createLogger(name){
    var options ={};
    options.name = name || 'vetebrae';
    options.streams = logConfig.Streams;
    return log = bunyan.createLogger(options); 

}