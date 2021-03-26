const { TooManyRequests } = require('http-errors')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create the Wallet Schema
const WalletSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    seed: {
        type: String,
        required: true  
    }
})

module.exports = Wallet = mongoose.model('wallets', WalletSchema)