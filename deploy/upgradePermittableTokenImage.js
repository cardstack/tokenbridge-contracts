const assert = require('assert')
const env = require('./src/loadEnv')
const { deployContract, sendRawTxHome } = require('./src/deploymentUtils')

const { web3Home, HOME_RPC_URL } = require('./src/web3')

const {
  homeContracts: { ERC677BridgeTokenPermittable, HomeMultiAMBErc20ToErc677 }
} = require('./src/loadContracts')

const { HOME_DEPLOYMENT_ACCOUNT_ADDRESS } = env

const {
  homeBridge: {
    homeBridgeMediator: { address: homeProxyAddress }
  },
  foreignBridge: {
    foreignBridgeMediator: { address: foreignProxyAddress }
  }
} = require('./bridgeDeploymentResults.json')

async function upgradePermittableTokenImage() {
  console.log('\n[Home] Deploying new ERC677 token image from ', HOME_DEPLOYMENT_ACCOUNT_ADDRESS)
  console.log(`  Home mediator: ${homeProxyAddress}`)
  let nonce = await web3Home.eth.getTransactionCount(HOME_DEPLOYMENT_ACCOUNT_ADDRESS)
  console.log(`  Nonce: ${nonce}`)

  const chainId = await web3Home.eth.getChainId()
  console.log(`  chainId: ${chainId}`)
  assert.strictEqual(chainId > 0, true, 'Invalid chain ID')

  const homeMediator = new web3Home.eth.Contract(HomeMultiAMBErc20ToErc677.abi, homeProxyAddress)

  const owner = await homeMediator.methods.owner().call()

  const erc677token = await deployContract(ERC677BridgeTokenPermittable, ['', '', 0, chainId], {
    from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
    nonce
  })

  const homeTokenImage = erc677token.options.address

  console.log('\n[Home] New ERC677 token image has been deployed: ', homeTokenImage)

  nonce++

  console.log('[Home] Setting the token image to the implementation')

  await homeMediator.methods.setTokenImage(homeTokenImage).send({
    from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
    nonce
  })

  nonce++

  const homeTokenList = HOME_TOKENS_TO_UPGRADE.split(',').map(a => a.trim())
  // eslint-disable-next-line no-restricted-syntax
  for (const homeTokenAddress of homeTokenList) {
    console.log('[Home] upgrading metadata of token ', homeTokenAddress)
    const token = new web3Home.eth.Contract(ERC677BridgeTokenPermittable.abi, homeTokenAddress)
    const migrateData = await token.methods
      .migrateTokenMetadata()
      .send({ from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS, nonce })

    console.log('New symbol', await token.methods.symbol().call())
    console.log('New name', await token.methods.name().call())

    nonce++
  }

  console.log('success')
}

async function main() {
  await upgradePermittableTokenImage()
}

main()
  .catch(e => {
    console.log('Error:', e)
    process.exit(1)
  })
  .then(() => process.exit(0))
