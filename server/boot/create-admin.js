var async = require('async');
var loopback = require('loopback');
var log = require('../../common-modules/logger')('create-admin');

module.exports = function Admin(app, done) {
    async.parallel([
        function createAdmin(cb) {
            var BaseUser = loopback.getModelByType('BaseUser');

            BaseUser.create({
                "username": "admin",
                "email": "admin@memorska.com",
                "password": "admin",
                "id": "adminBaseUserId"
            }, function (err, baseUser) {
                if (err){
                    
                        if(err.code === 11000){
                            log.info('Base User Already Created ');
                           return cb();
                        }
                        log.error('Error in Base User Creation ',err);
                        cb(err);
                } 
                else {
                    log.info('Base User Created ',baseUser);
                    cb();
                }
            })
        },
        function createAdminRole(cb) {
            var BaseRole = loopback.getModelByType('BaseRole');

            BaseRole.create({
                "name": "admin",
                "description": "Memorksa Admin",
                "id": "adminRoleId"
            }, function (err, baseRole) {
               // console.log('err ',err,'res ',res.body)
                if (err) {
                    if(err.code === 11000){
                        log.info('Base Role Already Created');
                        return cb();
                    }
                    log.error('Error in Base Role Creation ',baseRole);
                    cb(err);
                }
                else {
                    log.info('Base Role Created ',baseRole);
                    cb();
                }
            })
        }
    ], function (err) {
        if(err)
        {   
            log.error('Error in creating Base User or Base Role');
            return done(err);
        }else{
        var BaseRoleMapping = loopback.getModelByType('BaseRoleMapping');
        BaseRoleMapping.create({
            "id":"adminRoleMappingId",
            "principalType": "USER",
            "principalId": "adminBaseUserId",
            "roleId": "adminRoleId"
        },function(err,baseRoleMapping) {
            if(err) 
            {
                if(err.code === 11000){
                        log.info('Base Role Mapping Already Created');
                      return done();
                }
                log.error('Error in Creating Base Role Mapping ',err);
                done(err);

            }
            else{
                log.info('Base Role Mapping Created ',baseRoleMapping);
                done();
            }
        })
        }

        

     
    })
}