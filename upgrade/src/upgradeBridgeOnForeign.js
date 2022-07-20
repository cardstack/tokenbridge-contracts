require('dotenv').config()
const Web3 = require('web3')
const TrezorWalletProvider = require('trezor-cli-wallet-provider')
const proxyAbi = require('../../artifacts/contracts/upgradeability/EternalStorageProxy.sol/EternalStorageProxy.json')
  .abi

const {
  FOREIGN_RPC_URL,
  FOREIGN_BRIDGE_PROXY_STORAGE_ADDRESS,
  FOREIGN_GAS_PRICE,
  NEW_FOREIGN_BRIDGE_MEDIATOR_IMPLEMENTATION,
  FOREIGN_CURRENT_VERSION,
  FOREIGN_NEW_VERSION,
  FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
  FOREIGN_CHAIN_ID,
  FOREIGN_KEY_DERIVATION_PATH
} = process.env

const foreignProvider = new TrezorWalletProvider(FOREIGN_RPC_URL, {
  chainId: FOREIGN_CHAIN_ID,
  derivationPathPrefix: FOREIGN_KEY_DERIVATION_PATH,
  numberOfAccounts: 5
})
const web3 = new Web3(foreignProvider)

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

    console.log(`Attempting upgrade to ${FOREIGN_NEW_VERSION} (${NEW_FOREIGN_BRIDGE_MEDIATOR_IMPLEMENTATION})`)
    console.log('Sending upgrade transaction from', FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS)

    const upgradeCall = proxy.methods.upgradeTo(FOREIGN_NEW_VERSION, NEW_FOREIGN_BRIDGE_MEDIATOR_IMPLEMENTATION)

    const gas = await upgradeCall.estimateGas({ from: FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS })

    console.log('Estimated gas', gas)

    const receipt = await upgradeCall.send({
      from: FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
      gas,
      gasPrice: FOREIGN_GAS_PRICE
    })

    console.log(`Tx Hash: ${receipt.transactionHash}`)
    console.log('Version after', await proxy.methods.version().call())
    console.log('Implementation after', await proxy.methods.implementation().call())
  } catch (e) {
    console.log(e.message)
    console.log(e.stack)
  }
}

upgradeBridgeOnForeign()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .then(() => process.exit(0))
