const assert = require('assert')
const { web3Home, HOME_RPC_URL } = require('../web3')
const { deployContract, upgradeProxy } = require('../deploymentUtils')
const { HOME_DEPLOYMENT_ACCOUNT_ADDRESS, HOME_ERC677_TOKEN_IMAGE } = require('../loadEnv')

const {
  homeContracts: { EternalStorageProxy, HomeMultiAMBErc20ToErc677: HomeBridge, ERC677BridgeTokenPermittable }
} = require('../loadContracts')

async function deployHome(implementationOnly) {
  let nonce = await web3Home.eth.getTransactionCount(HOME_DEPLOYMENT_ACCOUNT_ADDRESS)

  let homeBridgeStorage

  if (!implementationOnly) {
    console.log('\n[Home] Deploying Bridge Mediator storage\n')
    homeBridgeStorage = await deployContract(EternalStorageProxy, [], {
      from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
      nonce
    })
    nonce++
    console.log('[Home] Bridge Mediator Storage: ', homeBridgeStorage.options.address)
  }

  console.log('\n[Home] Deploying Bridge Mediator implementation\n')
  const homeBridgeImplementation = await deployContract(HomeBridge, [], {
    from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
    nonce
  })
  nonce++
  console.log('[Home] Bridge Mediator Implementation: ', homeBridgeImplementation.options.address)

  if (implementationOnly) {
    return { homeImplementationAddress: homeBridgeImplementation.options.address }
  }

  console.log('\n[Home] Hooking up Mediator storage to Mediator implementation')
  await upgradeProxy({
    proxy: homeBridgeStorage,
    implementationAddress: homeBridgeImplementation.options.address,
    version: '1',
    nonce,
    url: HOME_RPC_URL
  })
  nonce++

  let homeTokenImage = HOME_ERC677_TOKEN_IMAGE
  if (HOME_ERC677_TOKEN_IMAGE === '') {
    console.log('\n[Home] Deploying new ERC677 token image')
    const chainId = await web3Home.eth.getChainId()
    assert.strictEqual(chainId > 0, true, 'Invalid chain ID')
    const erc677token = await deployContract(ERC677BridgeTokenPermittable, ['', '', 0], {
      from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
      nonce
    })
    homeTokenImage = erc677token.options.address
    console.log('\n[Home] New ERC677 token image has been deployed: ', homeTokenImage)
  } else {
    console.log('\n[Home] Using existing ERC677 token image: ', homeTokenImage)
  }

  console.log('\nHome part of MULTI_AMB_ERC20_TO_ERC677 bridge deployed\n')
  return {
    homeBridgeMediator: { address: homeBridgeStorage.options.address },
    homeTokenImage: { address: homeTokenImage }
  }
}

module.exports = deployHome
