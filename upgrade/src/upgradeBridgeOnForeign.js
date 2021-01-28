require('dotenv').config()
const Web3 = require('web3')
const proxyAbi = require('../../build/contracts/EternalStorageProxy').abi

const {
  FOREIGN_RPC_URL,
  FOREIGN_PRIVKEY,
  FOREIGN_BRIDGE_PROXY_STORAGE_ADDRESS,
  FOREIGN_GAS_PRICE,
  NEW_FOREIGN_BRIDGE_MEDIATOR_IMPLEMENTATION,
  FOREIGN_CURRENT_VERSION,
  FOREIGN_NEW_VERSION
} = process.env

const web3 = new Web3(new Web3.providers.HttpProvider(FOREIGN_RPC_URL))
const { address } = web3.eth.accounts.wallet.add(FOREIGN_PRIVKEY)

const upgradeBridgeOnForeign = async () => {
  try {
    const proxy = new web3.eth.Contract(proxyAbi, FOREIGN_BRIDGE_PROXY_STORAGE_ADDRESS)

    const versionBefore = await proxy.methods.version().call()

    console.log('Version before', versionBefore)
    console.log('Implementation before', await proxy.methods.implementation().call())

    if (versionBefore !== FOREIGN_CURRENT_VERSION) {
      throw new Error(
        `Expected current version of the contract to be ${FOREIGN_CURRENT_VERSION} but it was ${versionBefore} - aborting`
      )
    }

    console.log(`Attempting upgrade to ${FOREIGN_NEW_VERSION}`)
    console.log('Sending upgrade transaction from', address)

    const upgradeCall = proxy.methods.upgradeTo(FOREIGN_NEW_VERSION, NEW_FOREIGN_BRIDGE_MEDIATOR_IMPLEMENTATION)

    const gas = await upgradeCall.estimateGas({ from: address })

    console.log('Estimated gas', gas)

    const receipt = await upgradeCall.send({ from: address, gas, gasPrice: FOREIGN_GAS_PRICE })

    console.log(`Tx Hash: ${receipt.transactionHash}`)
    console.log('Version after', await proxy.methods.version().call())
    console.log('Implementation after', await proxy.methods.implementation().call())
  } catch (e) {
    console.log(e.message)
    console.log(e.stack)
  }
}

upgradeBridgeOnForeign()
