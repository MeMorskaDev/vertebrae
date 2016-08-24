var logConfig={
    Streams: [
    {
      level: 'debug',
      path: '/vertebrae/vertebrae.log'
    }
  ]
};


module.exports = logConfig;


var levels =["debug","info","warn","error","none","fatal"];


/**
 * Stream Example 
 * [
 * {       
 *    level: 'debug',
 *    stream: process.stdout
 * },
    {
      level: 'error',
      path: '/vertebrae.log'
    }
  ]
 * 
 * You can define a array of stream;
 * 
 * if you specify the log level as error ,
 *  then all the levels higher than error i.e "none" and "fatal" will log   
 * 
 */