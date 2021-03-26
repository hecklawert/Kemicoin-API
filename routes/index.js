var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const User = require('../model/User')
const Wallet = require('../model/Wallet')
const key = require('../config/keys').secret;
let seeds = require('../config/seed');

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
  let {
    name,
    username,
    email,
    password,
    confirm_password
  } = req.body
  if (password !== confirm_password) {
    return res.status(400).json({
      msg: "Password do not match."
    })
  }
  // Check for the unique Username
  User.findOne({
    username: username
  }).then(user => {
    if(user){
      return res.status(400).json({
        msg: "Username is already taken"
      })
    }
    // Check for the unique Email
    User.findOne({
      email: email
    }).then(user => {
      if(user) {
        return res.status(400).json({
          msg: "Email already taken. Did you forget your password?"
        })
      }
    })
    // The data is valid and now we can register the user...
    let newUser = new User({
      name,
      username,
      password,
      email
    })
    // ... and the wallet
    let newWallet = new Wallet({
      username,
      seed: seeds.generateNewSeed()
    })
    // Hash the password
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if(err) throw err
        newUser.password = hash
      })
    })
    //Store the seed
    newWallet.save().then(wallet => {
      newUser.save().then(user => {
        return res.status(201).json({
          success: true,
          msg: "User registered!"
        })
      })
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
  return res.json({
    user: req.user
  })
})

module.exports = router;
