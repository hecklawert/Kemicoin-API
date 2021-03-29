var express = require('express');
var router = express.Router();
const passport = require('passport')
const UserActions = require('../actions/UsersActions')

router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express Hola mundo' });
// });

router.post('/register', function(req, res) {
  UserActions.createNewUser(req.body).then( result => {
    return res.status(result.status).json({
      msg: result.msg
    })
  })
})

router.post('/login', function (req, res) {
  UserActions.loginUser(req).then( result => {
    return res.status(result.status).json({
      status: result.status,
      msg: result.msg,
      token: result.token
    })
  })  
})

router.get("/profile", passport.authenticate('jwt', {session: false}), (req, res) => {
  UserActions.getProfile(req).then( result => {
    return res.status(result.status).json({
      result
    })
  })
})

router.get("/getWallet", passport.authenticate('jwt', {session: false}), (req, res) => {
  UserActions.getWallet(req).then( result => {
    return res.status(result.status).json({
      result
    })
  })
})

module.exports = router;
