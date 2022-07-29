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
  }
} = require('./bridgeDeploymentResults.json')

async function upgradePermittableTokenImage() {
  console.log('\n[Home] Deploying new ERC677 token image from ', HOME_DEPLOYMENT_ACCOUNT_ADDRESS)
  console.log(`  Home mediator: ${homeProxyAddress}`)
  let nonce = await web3Home.eth.getTransactionCount(HOME_DEPLOYMENT_ACCOUNT_ADDRESS)
  console.log(`  Nonce: ${nonce}`)

  const erc677token = await deployContract(ERC677BridgeTokenPermittable, ['', '', 0], {
    from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
    nonce
  })

  const homeTokenImage = erc677token.options.address

  console.log('\n[Home] New ERC677 token image has been deployed: ', homeTokenImage)

  nonce++

  console.log('[Home] Setting the token image to the implementation')
  const homeMediator = new web3Home.eth.Contract(HomeMultiAMBErc20ToErc677.abi, homeProxyAddress)

  await homeMediator.methods.setTokenImage(homeTokenImage).send({
    from: HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
    nonce
  })

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
