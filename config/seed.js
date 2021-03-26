const { Wallet } = require('ethers');

function generateNewSeed(){
    let seeds = Wallet.createRandom().mnemonic.phrase
    return seeds
}


module.exports.generateNewSeed = generateNewSeed