const Web3Utils = require('web3-utils')
const assert = require('assert')
const { web3Foreign, FOREIGN_RPC_URL, deploymentPrivateKey } = require('../web3')
const {
  foreignContracts: { ForeignMultiAMBErc20ToErc677: ForeignBridge }
} = require('../loadContracts')
const { privateKeyToAddress, sendRawTxForeign } = require('../deploymentUtils')

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY, FOREIGN_ALLOW_TOKEN_LIST } = require('../loadEnv')

const DEPLOYMENT_ACCOUNT_ADDRESS = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)

async function allow(foreignAddress) {
  let nonce = await web3Foreign.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(ForeignBridge.abi, foreignAddress)

  const allowList = FOREIGN_ALLOW_TOKEN_LIST.split(',').map(a => a.trim())

  // eslint-disable-next-line no-restricted-syntax
  for (const allowedTokenAddress of allowList) {
    console.log(`Allowing ${allowedTokenAddress}`)
    const allowData = foreignBridge.methods.allowToken(allowedTokenAddress).encodeABI()

    // eslint-disable-next-line no-await-in-loop
    const txAllow = await sendRawTxForeign({
      data: allowData,
      nonce,
      to: foreignAddress,
      privateKey: deploymentPrivateKey,
      url: FOREIGN_RPC_URL
    })

    if (txAllow.status) {
      assert.strictEqual(Web3Utils.hexToNumber(txAllow.status), 1, 'Transaction Failed')
      console.log(`Success for ${allowedTokenAddress}`)
    } else {
      throw new Error('Failed')
    }
    nonce++
  }
}

module.exports = allow
