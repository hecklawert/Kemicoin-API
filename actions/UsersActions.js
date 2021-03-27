var bcrypt = require('bcryptjs')
const User = require('../model/User')
const Wallet = require('../model/Wallet')
let seeds = require('../config/seed');

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

module.exports.createNewUser = createNewUser;