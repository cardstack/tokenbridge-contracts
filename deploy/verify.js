const env = require('./src/loadEnv')
const verifier = require('./src/utils/verifier')

const { web3Home, web3Foreign } = require('./src/web3')

const proxyArtifact = require('../build/contracts/EternalStorageProxy')
const homeMediatorArtifact = require('../build/contracts/HomeMultiAMBErc20ToErc677')
const foreignMediatorArtifact = require('../build/contracts/ForeignMultiAMBErc20ToErc677')

const {
  homeBridge: {
    homeBridgeMediator: { address: homeProxyAddress }
  },
  foreignBridge: {
    foreignBridgeMediator: { address: foreignProxyAddress }
  }
} = require('./bridgeDeploymentResults.json')

async function verifyHome(artifact, address) {
  await verifier({
    artifact,
    address,
    apiUrl: env.HOME_EXPLORER_URL,
    apiKey: env.HOME_EXPLORER_API_KEY
  })
}

async function verifyForeign(artifact, address) {
  await verifier({
    artifact,
    address,
    apiUrl: env.FOREIGN_EXPLORER_URL,
    apiKey: env.FOREIGN_EXPLORER_API_KEY
  })
}

async function main() {
  // Home

  console.log('Home proxy address', homeProxyAddress)
  await verifyHome(proxyArtifact, homeProxyAddress)

  const homeProxy = new web3Home.eth.Contract(proxyArtifact.abi, homeProxyAddress)
  const homeImplementationAddress = await homeProxy.methods.implementation().call()

  console.log('Home implementation address', homeImplementationAddress)

  await verifyHome(homeMediatorArtifact, homeImplementationAddress)

  // Foreign

  console.log('Foreign proxy address', foreignProxyAddress)
  await verifyForeign(proxyArtifact, foreignProxyAddress)

  const foreignProxy = new web3Foreign.eth.Contract(proxyArtifact.abi, foreignProxyAddress)
  const foreignImplementationAddress = await foreignProxy.methods.implementation().call()

  console.log('Foreign implementation address', foreignImplementationAddress)
  await verifyForeign(foreignMediatorArtifact, foreignImplementationAddress)
}

main()
  .catch(e => {
    console.log('Error:', e)
    process.exit(1)
  })
  .then(() => process.exit(0))
