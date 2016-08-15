var async = require('async');
var loopback = require('loopback');

module.exports = function Admin(app, done) {
    console.log('Inside Create Admin');
    async.parallel([
        function createAdmin(cb) {
            var BaseUser = loopback.getModelByType('BaseUser');

            BaseUser.create({
                "username": "admin",
                "email": "admin@memorska.com",
                "password": "admin",
                "id": "adminBaseUserId"
            }, function (err, res) {
                console.log('err ',err, 'res ',res );
                if (err){
                    
                        if(err.code === 11000){
                           return cb();
                        }
                        cb(err);
                } 
                else {
                    console.log('User Created ', res.body);
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
            }, function (err, res) {
                console.log('err ',err,'res ',res.body)
                if (err) {
                    if(err.code === 11000){
                        return cb();
                    }
                    cb(err);
                }
                else {
                    console.log('Role Created ', res.body);
                    cb();
                }
            })
        }
    ], function (err) {

        var BaseRoleMapping = loopback.getModelByType('BaseRoleMapping');

        BaseRoleMapping.create({
            "id":"adminRoleMappingId",
            "principalType": "USER",
            "principalId": "adminBaseUserId",
            "roleId": "adminRoleId"
        },function(params) {
            if(err) 
            {
                if(err.code === 11000){
                      return done();
                }
                done(err);

            }
            else{
                done();
            }
        })
    })
}