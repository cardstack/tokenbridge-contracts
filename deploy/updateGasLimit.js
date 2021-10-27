const Web3Utils = require('web3-utils')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const BigNumber = require('bignumber.js')

const { web3Foreign, FOREIGN_RPC_URL } = require('./src/web3')
const {
  foreignContracts: { ForeignMultiAMBErc20ToErc677: ForeignBridge }
} = require('./src/loadContracts')
const { sendRawTxForeign } = require('./src/deploymentUtils')

const { FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS, FOREIGN_ALLOW_TOKEN_LIST } = require('./src/loadEnv')

async function updateForeignGasLimit(foreignAddress, newGasLimit) {
  let nonce = await web3Foreign.eth.getTransactionCount(FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(ForeignBridge.abi, foreignAddress)

  const setData = foreignBridge.methods.setRequestGasLimit(newGasLimit).encodeABI()

  const txData = {
    data: setData,
    nonce,
    to: foreignAddress,
    from: FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
    url: FOREIGN_RPC_URL
  }

  console.log(txData)

  const txSet = await sendRawTxForeign(txData)

  if (txSet.status) {
    assert.strictEqual(Web3Utils.hexToNumber(txAllow.status), 1, 'Transaction Failed')
    console.log(`Success!`)
  } else {
    throw new Error('Failed')
  }
}

async function main() {
  const foreignAddress = JSON.parse(fs.readFileSync(path.join(__dirname, './bridgeDeploymentResults.json')))
    .foreignBridge.foreignBridgeMediator.address

  console.log('Foreign address is', foreignAddress)
  console.log('FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS', FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS)
  await updateForeignGasLimit(foreignAddress, '150000')
}

main()
  .catch(e => {
    console.log('Error:', e)
    process.exit(1)
  })
  .then(() => process.exit(0))
