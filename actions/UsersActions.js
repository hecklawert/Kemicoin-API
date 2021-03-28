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
  
  // By default the response is gonna be 404
  let userChecked
  let response = {
    success: false,
    status: 404,
    msg: "Login incorrect."
  }

  // Check if the username is in DB
  await _checkUsernameUsed(req.body.username).then(user => {
    if(user){
      console.log("deberia definirse userChecked")
      userChecked = {
        username: user.username,
        password: user.password
      }
    }
  })

  // Checks the password if the user exists, if password is correct will return 201.
  if(userChecked){
    await _checksPassword(req.body.password, userChecked.password).then(isMatch => {
      if(isMatch){
        response = {
          success: true,
          status: 201,
          msg: "You're logged in."
        }
      }
    })
  }

  return response

}


module.exports = {
  createNewUser,
  loginUser
} 
