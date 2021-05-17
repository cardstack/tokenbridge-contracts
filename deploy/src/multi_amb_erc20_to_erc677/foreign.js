const { web3Foreign, FOREIGN_RPC_URL } = require('../web3')
const { deployContract, upgradeProxy } = require('../deploymentUtils')
const {
  foreignContracts: { EternalStorageProxy, ForeignMultiAMBErc20ToErc677: ForeignBridge }
} = require('../loadContracts')
const { FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS } = require('../loadEnv')

async function deployForeign(implementationOnly) {
  let nonce = await web3Foreign.eth.getTransactionCount(FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS)

  let foreignBridgeStorage

  if (!implementationOnly) {
    console.log('\n[Foreign] Deploying Bridge Mediator storage\n')
    foreignBridgeStorage = await deployContract(EternalStorageProxy, [], {
      from: FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
      network: 'foreign',
      nonce
    })
    nonce++
    console.log('[Foreign] Bridge Mediator Storage: ', foreignBridgeStorage.options.address)
  }

  console.log('\n[Foreign] Deploying Bridge Mediator implementation\n')
  const foreignBridgeImplementation = await deployContract(ForeignBridge, [], {
    from: FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
    network: 'foreign',
    nonce
  })
  nonce++
  console.log('[Foreign] Bridge Mediator Implementation: ', foreignBridgeImplementation.options.address)

  if (implementationOnly) {
    return { foreignImplementationAdress: foreignBridgeImplementation.options.address }
  }

  console.log('\n[Foreign] Hooking up Mediator storage to Mediator implementation')
  await upgradeProxy({
    proxy: foreignBridgeStorage,
    implementationAddress: foreignBridgeImplementation.options.address,
    version: '1',
    nonce,
    url: FOREIGN_RPC_URL
  })

  console.log('\nForeign part of MULTI_AMB_ERC20_TO_ERC677 bridge deployed\n')
  return {
    foreignBridgeMediator: { address: foreignBridgeStorage.options.address }
  }
}

module.exports = deployForeign
