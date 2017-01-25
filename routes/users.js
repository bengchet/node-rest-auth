var express = require('express');
var router = express.Router();
var gcm = require('node-gcm');
var gcm_api_key = process.env.GCM_API_KEY;
var User = require('../app/models/user');
var Device = require('../app/models/device');

/* GET users listing. */

/*router.use('/', function(req, res, next){
  console.log(req.headers.authorization);
  if(req.headers.authorization != 'test'){
	return res.redirect('/');
  }
  next();
});*/

router.get('/', function(req, res, next) {
  User.find({}, {_id: 0, name: 1}, function(err, users){
      if(err) console.log(err)
      if(users){
        var _users = [];
        users.forEach(function(user){
          _users.push(user.name)
        })
        res.render('users',{users: JSON.stringify(_users)});
      }
      else{
        res.render('users',{users: []});
      }
  });
});

router.get("/push", function(req, res){
    console.log(req.query);
    //FCM push notification
    var retry_times = 4; //the number of times to retry sending the message if it fails
    var sender = new gcm.Sender(gcm_api_key); //create a new sender
    //create a new message
    var message = {};
    var data = {
        'title': req.query.title,
        'message': req.query.body,
        'sound': 'default',
        'info': req.query.body,
        'content-available': '1',
        'timestamp': new Date().getTime()
      };
    message.data = data; 
    message.priority = "high";
    message.restricted_package_name = "com.ionicframework.mylora138236";
    //message.to ="/topics/all";
    
    User.findOne({name: req.query.person}, function(err, user){
      if(user && !err){
        var _registrationTokens= [];
        Device.find({_id: {"$in":user["devices"]}}, {_id:0, device_token:1}, function(err, devices){
          if(!err && devices){
            devices.forEach(function(u){
              _registrationTokens.push(u.device_token)
            })
            sender.send(new gcm.Message(message), {registrationTokens:  _registrationTokens}, retry_times, function (result) {
                console.log(JSON.stringify(message));
                res.status(200).json({"success":true});
            }, function (err) {
                res.status(500).send({"success":false});
            });
          }
        });
      }
    });
    
});


module.exports = router;
