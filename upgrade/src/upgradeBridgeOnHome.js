require('dotenv').config()
const Web3 = require('web3')
const proxyAbi = require('../../build/contracts/EternalStorageProxy').abi

const {
  HOME_RPC_URL,
  HOME_PRIVKEY,
  HOME_BRIDGE_PROXY_STORAGE_ADDRESS,
  HOME_GAS_PRICE,
  NEW_HOME_BRIDGE_MEDIATOR_IMPLEMENTATION,
  HOME_CURRENT_VERSION,
  HOME_NEW_VERSION
} = process.env

const web3 = new Web3(new Web3.providers.HttpProvider(HOME_RPC_URL))
const { address } = web3.eth.accounts.wallet.add(HOME_PRIVKEY)

const upgradeBridgeOnHome = async () => {
  try {
    const proxy = new web3.eth.Contract(proxyAbi, HOME_BRIDGE_PROXY_STORAGE_ADDRESS)

    const versionBefore = await proxy.methods.version().call()

    console.log('Version before', versionBefore)
    console.log('Implementation before', await proxy.methods.implementation().call())

    if (versionBefore !== HOME_CURRENT_VERSION) {
      throw new Error(
        `Expected current version of the contract to be ${HOME_CURRENT_VERSION} but it was ${versionBefore} - aborting`
      )
    }

    console.log(`Attempting upgrade to ${HOME_NEW_VERSION}`)
    console.log('Sending upgrade transaction from', address)

    const upgradeCall = proxy.methods.upgradeTo(HOME_NEW_VERSION, NEW_HOME_BRIDGE_MEDIATOR_IMPLEMENTATION)

    const gas = await upgradeCall.estimateGas({ from: address })

    console.log('Estimated gas', gas)

    const receipt = await upgradeCall.send({ from: address, gas, gasPrice: HOME_GAS_PRICE })

    console.log(`Tx Hash: ${receipt.transactionHash}`)
    console.log('Version after', await proxy.methods.version().call())
    console.log('Implementation after', await proxy.methods.implementation().call())
  } catch (e) {
    console.log(e.message)
    console.log(e.stack)
  }
}

upgradeBridgeOnHome()
