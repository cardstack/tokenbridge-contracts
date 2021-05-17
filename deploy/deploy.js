const fs = require('fs')
const path = require('path')
const env = require('./src/loadEnv')

const { BRIDGE_MODE, DEPLOY_IMPLEMENTATIONS_ONLY } = env

const deployResultsPath = path.join(__dirname, './bridgeDeploymentResults.json')

function writeDeploymentResults(data) {
  fs.writeFileSync(deployResultsPath, JSON.stringify(data, null, 4))
  console.log('Contracts Deployment have been saved to `bridgeDeploymentResults.json`')
}

async function deployMultiAMBErcToErc() {
  const preDeploy = require('./src/multi_amb_erc20_to_erc677/preDeploy')
  const deployHome = require('./src/multi_amb_erc20_to_erc677/home')
  const deployForeign = require('./src/multi_amb_erc20_to_erc677/foreign')
  const initializeHome = require('./src/multi_amb_erc20_to_erc677/initializeHome')
  const initializeForeign = require('./src/multi_amb_erc20_to_erc677/initializeForeign')
  const allow = require('./src/multi_amb_erc20_to_erc677/allow')

  if (!DEPLOY_IMPLEMENTATIONS_ONLY) {
    await preDeploy()
  }
  const { homeBridgeMediator, homeTokenImage, homeImplementationAddress } = await deployHome(
    DEPLOY_IMPLEMENTATIONS_ONLY
  )
  const { foreignBridgeMediator, foreignImplementationAdress } = await deployForeign(DEPLOY_IMPLEMENTATIONS_ONLY)

  if (DEPLOY_IMPLEMENTATIONS_ONLY) {
    console.log('\nDeployment has been completed.\n\n')
    console.log(`[   Home  ] Bridge implementation: ${homeImplementationAddress}`)
    console.log(`[ Foreign ] Bridge implementation: ${foreignImplementationAdress}`)
    return
  }

  await initializeHome({
    homeBridge: homeBridgeMediator.address,
    foreignBridge: foreignBridgeMediator.address,
    homeTokenImage: homeTokenImage.address
  })

  await initializeForeign({
    foreignBridge: foreignBridgeMediator.address,
    homeBridge: homeBridgeMediator.address
  })

  await allow(foreignBridgeMediator.address)

  console.log('\nDeployment has been completed.\n\n')
  console.log(`[   Home  ] Bridge Mediator: ${homeBridgeMediator.address}`)
  console.log(`[ Foreign ] Bridge Mediator: ${foreignBridgeMediator.address}`)
  writeDeploymentResults({
    homeBridge: {
      homeBridgeMediator
    },
    foreignBridge: {
      foreignBridgeMediator
    }
  })
}

async function main() {
  console.log(`Bridge mode: ${BRIDGE_MODE}`)
  switch (BRIDGE_MODE) {
    case 'MULTI_AMB_ERC_TO_ERC':
      await deployMultiAMBErcToErc()
      break
    default:
      console.log(BRIDGE_MODE)
      throw new Error('Please specify BRIDGE_MODE: NATIVE_TO_ERC or ERC_TO_ERC')
  }
}

main()
  .catch(e => {
    console.log('Error:', e)
    process.exit(1)
  })
  .then(() => process.exit(0))
