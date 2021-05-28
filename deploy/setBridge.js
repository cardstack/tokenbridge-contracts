require('dotenv').config()
const Web3 = require('web3')
const TrezorWalletProvider = require('trezor-cli-wallet-provider')
const jsonHomeInterface = require('../build/contracts/HomeMultiAMBErc20ToErc677')

const {
  HOME_RPC_URL,
  HOME_BRIDGE_OWNER,
  HOME_GAS_PRICE,
  HOME_MEDIATOR_REQUEST_GAS_LIMIT,
  HOME_CHAIN_ID,
  HOME_KEY_DERIVATION_PATH,
  BRIDGE_UTILS_ON_HOME_ADDRESS
} = process.env

const {
  homeBridge: {
    homeBridgeMediator: { address: homeProxyAddress }
  }
} = require('./bridgeDeploymentResults.json')

const homeProvider = new TrezorWalletProvider(HOME_RPC_URL, {
  chainId: HOME_CHAIN_ID,
  derivationPathPrefix: HOME_KEY_DERIVATION_PATH
})
const web3 = new Web3(homeProvider)

const setBridgeOnHome = async () => {
  try {
    const contract = new web3.eth.Contract(jsonHomeInterface.abi, homeProxyAddress)

    let currentAddress = await contract.methods.bridgeUtils().call()
    console.log('Current bridge utils address', currentAddress)

    if (currentAddress === BRIDGE_UTILS_ON_HOME_ADDRESS) {
      console.log('Already set correctly')
      process.exit(0)
    }

    console.log('Attempting to set to', BRIDGE_UTILS_ON_HOME_ADDRESS)
    const tx = contract.methods.setBridgeUtilsContract(BRIDGE_UTILS_ON_HOME_ADDRESS)

    const data = tx.encodeABI()
    const nonce = await web3.eth.getTransactionCount(HOME_BRIDGE_OWNER)
    const txData = {
      from: HOME_BRIDGE_OWNER,
      to: contract.options.address,
      data,
      gas: HOME_MEDIATOR_REQUEST_GAS_LIMIT,
      gasPrice: HOME_GAS_PRICE,

      nonce
    }

    console.log(txData)
    const receipt = await web3.eth.sendTransaction(txData)
    console.log(`Transaction hash: ${receipt.transactionHash}`)

    currentAddress = await contract.methods.bridgeUtils().call()
    console.log('new bridge utils address', currentAddress)
  } catch (e) {
    console.log(e.message)
    console.log(e.stack)
  }
}

setBridgeOnHome()
  .catch(e => {
    console.log('Error:', e)
    process.exit(1)
  })
  .then(() => process.exit(0))
