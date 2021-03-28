var bcrypt = require('bcryptjs')
const User = require('../model/User')
const Wallet = require('../model/Wallet')
let seeds = require('../config/seed');
const jwt = require('jsonwebtoken')
const key = require('../config/keys').secret;

// =================================================================
//                       /register functions
// =================================================================

/**
 *  @desc Register a new user
 *  @access Public 
 *  @todo Should check that email field is a valid email
 */
async function createNewUser(request){
  // Get params of the request
  let {
    name,
    username,
    email,
    password,
    confirm_password
  } = request

  // Check if password matchs
  if (password !== confirm_password) {
    return {
      success: false,
      status: 400,
      msg: "Password do not match."
    }
  }

  // Check if the username or the email is in DB
  if(await _checkUsernameUsed(username)){
    return {
      success: false,
      status: 400,
      msg: "Username is used"
    }
  }else{
    if(await _checkEmailUsed(email)){
      return {
        success: false,
        status: 400,
        msg: "Email already taken. Did you forget your password?"
      }
    }
  }

  //The data is valid and now we can register the user...
  await _hashData(password).then(result => {
    password = result
  })
  let newUser = new User({
    name,
    username,
    password, // Hash the password
    email
  })
  
  // ... and the wallet
  let newWallet = new Wallet({
    username,
    seed: seeds.generateNewSeed()
  })  

  //Store the user
  newWallet.save()
  newUser.save()
  
  return {
    success: true,
    status: 201,
    msg: "User registered!"
  }
}

/**
 *  @desc Checks if an username is used by another user
 *  @access Private 
 *  @returns boolean
 */
async function _checkUsernameUsed(username){
  const userPromise = await new Promise((resolve, reject) => {
    User.findOne({
      username: username
    }).then(userState => {
      resolve(userState)
    })    
  })
  return userPromise
}

/**
 *  @desc Checks if an email is used by another user
 *  @access Private 
 *  @returns boolean
 */
async function _checkEmailUsed(email){
  const emailPromise = await new Promise((resolve, reject) => {
    User.findOne({
      email: email
    }).then(emailState => {
      resolve(emailState)
    })    
  })
  return emailPromise
}

/**
 *  @desc Hashes the password
 *  @access Private 
 *  @returns string
 */
async function _hashData(data){
  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(data, 10, function(err, hash) {
      if (err) reject(err)
      resolve(hash)
    });
  })
  return hashedPassword
}

/**
 *  @desc Check if password is correct
 *  @access Private 
 *  @returns boolean
 */
 async function _checksPassword(_password1, _password2){
  const match = await bcrypt.compare(_password1, _password2);
  if(match) return true
  return false
}


// =================================================================
//                       /login functions
// =================================================================

async function loginUser(req){
  
  // By default the response is gonna be 404.
  let userChecked
  let response = {
    success: false,
    status: 404,
    token: {},
    msg: "Login incorrect."
  }

  // Check if the username is in DB.
  await _checkUsernameUsed(req.body.username).then(user => {
    if(user){
      userChecked = {
        _id: user._id,
        name: user.name,
        username: user.username,
        password: user.password,
        email: user.email
      }
    }
  })

  // Checks the password if the user exists.
  if(userChecked){
    await _checksPassword(req.body.password, userChecked.password).then(isMatch => {
      if(isMatch){
        //User's password is correct and we need to send the JSON Token for that user
        response = {
          success: true,
          status: 201,
          token: _generateJwtToken(userChecked),
          msg: "You're logged in."
        }
      }

    })
  }

  return response

}

/**
 *  @desc Generate JWT Token from Payload 
 *  @access Private 
 *  @returns string
 */
function _generateJwtToken(_payload){
  let payload = {
    _id: _payload._id,
    username: _payload.username,
    email: _payload.email
  }
  const JwtSigned = jwt.sign(payload, key, {
    expiresIn: 604800
  }) 
  return JwtSigned
}


// =================================================================
//                       /profile functions
// =================================================================

async function getProfile(request) {
  let userChecked

  // Check if the user is registered.
  await _checkUsernameUsed(req.body.username).then(user => {
    if(user){
      userChecked = {
        _id: user._id,
        name: user.name,
        username: user.username,
        password: user.password,
        email: user.email,
        date: user.date,
        seed
      }
    }
  })

  // If user is registered, recover the wallet.
  if(userChecked){
    await _findUserWallet(userChecked.username).then(wallet => {
      userChecked.seed = wallet.seed
    })
  }
  
  return userChecked

}

async function _findUserWallet(username){
  const walletPromise = await new Promise((resolve, reject) => {
    Wallet.findOne({
      username: username
    }).then(walletState => {
      resolve(walletState)
    })    
  })
  return walletPromise
}



module.exports = {
  createNewUser,
  loginUser,
  getProfile
} 
