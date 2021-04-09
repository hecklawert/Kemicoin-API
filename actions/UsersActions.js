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

/**
 *  @desc Logs user
 *  @access Public 
 */

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
    // Get the user seed
    await _findUserWallet(req.body.username).then(wallet => {
      userChecked['seed'] = wallet.seed
    })
    // Check password and if is correct return the response
    await _checksPassword(req.body.password, userChecked.password).then(isMatch => {
      if(isMatch){
        //User's password is correct and we need to send the JSON Token for that user
        response = {
          success: true,
          status: 200,
          token: "Bearer "+_generateJwtToken(userChecked),
          msg: "You're logged in.",
          user: userChecked
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

/**
 *  @desc Get the entire profile of an user
 *  @access Public 
 */

async function getProfile(request) {
  let userChecked 

  // Check if the user is registered.
  await _checkUsernameUsed(request.user.username).then(user => {
    if(user){
      userChecked = {
        _id: user._id,
        name: user.name,
        username: user.username,
        password: user.password,
        email: user.email,
        date: user.date,
      }
    }
  })

  // If user is registered, recover the wallet.
  if(userChecked){
    await _findUserWallet(userChecked.username).then(wallet => {
      userChecked.seed = wallet.seed
    })
  }

  if(userChecked) {
    return{
      success: true,
      status: 200,
      user: userChecked
    }
  }else{
    return{
      success: false,
      status: 400,
    }
  }
}

/**
 *  @desc Get the wallet of an user
 *  @access Public 
 */

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


// =================================================================
//                       /getWallet functions
// =================================================================

/**
 *  @desc Get the wallet seed of user
 *  @access Public 
 */

 async function getWallet(request) {
  let seed
  // If user is registered, recover the wallet.
  await _findUserWallet(request.user.username).then(wallet => {
    seed = wallet.seed
  })

  if(seed){
    return {
      success: true,
      status: 200,
      seed
    }
  }else{
    return {
      success: true,
      status: 404,
      msg: "Wallet not found"
    }
  }
}


// =================================================================
//                       /user/updateUser functions
// =================================================================

/**
 *  @desc Update user profile
 *  @access Public 
 */

 async function updateUser(request) {
  // Get user data request
  let user = {
    _id : request.body.id,
    name: request.body.name,
    email: request.body.email
  }

  // Set parameters to the query
  const filter = { _id:  user._id}
  const options = { upsert: false }; // This prevent to insert new registry if user is not found

  const updateDoc = {
    $set: {
      name: user.name,
      email: user.email
    },
  };

  // Update the user in DDBB
  const query = await User.findByIdAndUpdate( filter , updateDoc, (err, docs) => {
    if(err){
        console.log("Error updating DDBB")
    }
  });

  if(query){
    return {
      success: true,
      status: 201,
      msg: "User updated!",
      user: {
        name: user.name,
        email: user.email
      }
    }
  }else{
    return {
      success: false,
      status: 500,
      msg: "Error updating DDBB"
    }
  }
}


// =================================================================
//                       /user/updatePassword functions
// =================================================================

/**
 *  @desc Update user's password
 *  @access Public 
 */

 async function updatePassword(request) {
  // Check if password and confirmed password field matches
  if(request.body.password != request.body.cpassword){
    return {
      success: false,
      status: 500,
      msg: "Passwords doesn't match"
    }    
  }

  // Hash the password
  let hashedPassword = await _hashData(request.body.password)

  // Set parameters to the query
  const filter = { _id:  request.body.id}
  const options = { upsert: false }; // This prevent to insert new registry if user is not found

  const updateDoc = {
    $set: {
      password: hashedPassword
    },
  };

  // Update the password in DDBB
  const query = await User.findByIdAndUpdate( filter , updateDoc, (err, docs) => {
    if(err){
        console.log("Error updating DDBB")
    }
  });  

  if(query){
    return {
      success: true,
      status: 201,
      msg: "Password updated!",
    }
  }else{
    return {
      success: false,
      status: 500,
      msg: "Error updating DDBB"
    }
  }  

}

module.exports = {
  createNewUser,
  loginUser,
  getProfile,
  getWallet,
  updateUser,
  updatePassword
} 