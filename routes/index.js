var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const User = require('../model/User')
const Wallet = require('../model/Wallet')
const key = require('../config/keys').secret;
let seeds = require('../config/seed')
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
  User.findOne({
    username: req.body.username
  }).then(user => {
    if(!user) {
      return res.status(404).json({
        msg: "User is not found.",
        success: false
      })
    }
    // If there is user we are now going to compare the password
    bcrypt.compare(req.body.password, user.password).then(isMatch => {
      if(isMatch) {
        //User's password is correct and we need to send the JSON Token for that user
        const payload = {
          _id: user.id,
          username: user.name,
          name: user.name,
          email: user.email
        }
        jwt.sign(payload, key, {
          expiresIn: 604800
        }, (err, token) => {
          res.status(200).json({
            success: true,
            token: `Bearer ${token}`,
            msg: 'You are logged!'
          })
        })
      }else{
        return res.status(404).json({
          msg: "User is not found.",
          success: false
        })        
      }
    })
  })
})

router.get("/profile", passport.authenticate('jwt', {session: false}), (req, res) => {
  User.findOne({
    username: req.user.username
  }).then(user => {
    if(!user) {
      return res.status(404).json({
        msg: "User is not found.",
        success: false
      })
    }else{
      let profile = user
      Wallet.findOne({
        username: req.user.username
      }).then(wallet => {
        if(wallet) {
          let walletProfile = wallet
          return res.status(201).json({
            user: req.user,
            wallet: walletProfile
          })
        }else{
          return res.status(404).json({
            msg: "Wallet is not found. Contact to support.",
            success: false
          })
        }
      })
    }
  })
})

module.exports = router;
