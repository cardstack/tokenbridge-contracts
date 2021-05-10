const Web3Utils = require('web3-utils')
const assert = require('assert')
const { web3Foreign, FOREIGN_RPC_URL } = require('../web3')
const {
  foreignContracts: { ForeignMultiAMBErc20ToErc677: ForeignBridge }
} = require('../loadContracts')
const { sendRawTxForeign } = require('../deploymentUtils')

const { FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS, FOREIGN_ALLOW_TOKEN_LIST } = require('../loadEnv')

async function allow(foreignAddress) {
  let nonce = await web3Foreign.eth.getTransactionCount(FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS)
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
      from: FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
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
