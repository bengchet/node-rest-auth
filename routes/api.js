var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var passport = require('passport');
var jwt      = require('jwt-simple');

var User = require('../app/models/user');
var Device = require('../app/models/device');
var config = require('../config/database'); // get db config file

// connect to database
mongoose.connect(config.database);

// pass passport for configuration
// this will check if the user is allowed to see route '/memberinfo'
require('../config/passport')(passport);

// bundle our routes
//var apiRoutes = express.Router();

router.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
router.post('/login', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
 
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

// route to a restricted info (GET http://localhost:8080/api/memberinfo)
router.get('/authenticate', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findById(decoded._id, function(err, user) {
        if (err) throw err;
 
        if (!user) {
          return res.status(403).send({success: false, msg: 'Authentication failed. User not found.', user: {}});
        } else {
          res.json({success: true, msg: '', user: {name: user.name}});
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});
 
var getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

router.post('/registerToken', passport.authenticate('jwt', {session: false}), function(req, res){
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findById(decoded._id, function(err, user) {
        if (err) throw err;
 
        if (!user) {
          return res.status(403).send({success: false, msg: 'Authentication failed. User not found.', user: {}});
        } else {
          
          // get the old and new device token
          var _token = req.body.device_token,
          _old_token;
          if(req.body.old_device_token){
            _old_token = req.body.old_device_token;
            console.log(_old_token);
          }
          
          Device.findOne({device_token: _token}, function(err, device){
            if(err) console.log(err);
            else if(!device){
              //start register
              new Device({
                owner: user._id,
                device_token: _token
              }).save(function(err, device){
                if (err){
                  console.log(err);
                  return res.status(403).json({success: false, msg: 'Failed to register new device.'});
                }
                else{
                  //if got old token
                  /*if(_old_token){
                    //search for such device
                    Device.findOne({device_token: _old_token}, function(err, old_device){
                      if(err) console.log(err);
                      else {
                        //if device exists, remove them and also remove device key from user
                        old_device.remove(function(err){
                          if(!err){
                            //remove device key from user
                            User.update({_id: user._id}, {$pull: {'devices': old_device._id}}, {upsert: true}, function(err){
                              if(err) console.log(err)
                      		  });
                          }
                        })
                      }
                    });
                  }*/
                  
                  //register new device_token to user
                  User.update({_id: user._id}, {$push: {devices: device._id}}, {upsert: true}, function(err){
                		if(err){
                		  console.log(err);
                		  return res.status(403).json({success: false, msg: 'Failed to register device to the user.'});
                		}
                		else{
                		  return res.json({success: true, msg: 'Device registered to the user.'});
                		}
                	});
            		}
            	});
            }
            else{
              //device is already existed, just check user if has the device token registered, if not just update
              var idx = user.devices.indexOf(device._id);
              console.log('idx: '+idx);
              if(idx < 0){
                //device is not found in user, update
                User.update({_id: user._id}, {$push: {devices: device._id}}, {upsert: true}, function(err){
            		    if(err){
            		      console.log(err);
            		      return res.status(403).json({success: false, msg: 'Failed to register device.'});
            		    }
            		    else{
            		      return res.json({success: true, msg: 'Device registered to the user.'});
            		    }
            		  });
              }
              else{
                //device already registered, just return
                return res.json({success: true, msg: 'Device already registered to the user.'});
              }
            }
          })
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
})

module.exports = router;
