var express = require('express');
var router = express.Router();
const passport = require('passport')
const UserActions = require('../actions/UsersActions')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  router.post("/updateUser", passport.authenticate('jwt', {session: false}), (req, res) => {
    UserActions.updateUser(req).then( result => {
      return res.status(result.status).json({
        result
      })
    })
  })