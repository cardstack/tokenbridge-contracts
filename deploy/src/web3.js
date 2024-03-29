const Web3 = require('web3')
const TrezorWalletProvider = require('trezor-cli-wallet-provider')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const env = require('./loadEnv')

const {
  HOME_RPC_URL,
  HOME_CHAIN_ID,
  HOME_KEY_DERIVATION_PATH,
  FOREIGN_RPC_URL,
  FOREIGN_CHAIN_ID,
  FOREIGN_KEY_DERIVATION_PATH,
  GET_RECEIPT_INTERVAL_IN_MILLISECONDS,
  HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
  FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
  HOME_EXPLORER_URL,
  FOREIGN_EXPLORER_URL,
  HOME_EXPLORER_API_KEY,
  FOREIGN_EXPLORER_API_KEY
} = env

let homeProvider, foreignProvider

if (process.env.HOME_DEPLOYMENT_ACCOUNT_PRIVATE_KEY) {
  // Create web3.js middleware that signs transactions locally
  homeProvider = new HDWalletProvider({
    privateKeys: [process.env.HOME_DEPLOYMENT_ACCOUNT_PRIVATE_KEY],
    providerOrUrl: HOME_RPC_URL
  })
} else {
  homeProvider = new TrezorWalletProvider(HOME_RPC_URL, {
    chainId: HOME_CHAIN_ID,
    derivationPathPrefix: HOME_KEY_DERIVATION_PATH,
    numberOfAccounts: 3
  })
}
if (process.env.FOREIGN_DEPLOYMENT_ACCOUNT_PRIVATE_KEY) {
  foreignProvider = new HDWalletProvider({
    privateKeys: [process.env.FOREIGN_DEPLOYMENT_ACCOUNT_PRIVATE_KEY],
    providerOrUrl: FOREIGN_RPC_URL
  })
} else {
  foreignProvider = new TrezorWalletProvider(FOREIGN_RPC_URL, {
    chainId: FOREIGN_CHAIN_ID,
    derivationPathPrefix: FOREIGN_KEY_DERIVATION_PATH,
    numberOfAccounts: 3
  })
}
let web3Home = new Web3(homeProvider)
let web3Foreign = new Web3(foreignProvider)

const { HOME_DEPLOYMENT_GAS_PRICE, FOREIGN_DEPLOYMENT_GAS_PRICE } = env
const GAS_LIMIT_EXTRA = env.DEPLOYMENT_GAS_LIMIT_EXTRA

module.exports = {
  web3Home,
  web3Foreign,
  HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
  FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS,
  HOME_RPC_URL,
  FOREIGN_RPC_URL,
  GAS_LIMIT_EXTRA,
  HOME_DEPLOYMENT_GAS_PRICE,
  FOREIGN_DEPLOYMENT_GAS_PRICE,
  GET_RECEIPT_INTERVAL_IN_MILLISECONDS,
  HOME_EXPLORER_URL,
  FOREIGN_EXPLORER_URL,
  HOME_EXPLORER_API_KEY,
  FOREIGN_EXPLORER_API_KEY
}
