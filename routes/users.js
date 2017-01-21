var express = require('express');
var router = express.Router();

/* GET users listing. */

/*router.use('/', function(req, res, next){
  console.log(req.headers.authorization);
  if(req.headers.authorization != 'test'){
	return res.redirect('/');
  }
  next();
});*/

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
