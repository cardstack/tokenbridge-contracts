require('@nomiclabs/hardhat-truffle5')
require('hardhat-contract-sizer')
require('hardhat-gas-reporter')
require('solidity-coverage')
require('@nomiclabs/hardhat-etherscan')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.4.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10
      }
    }
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545'
    },
    kovan: {
      url: process.env.KOVAN_RPC_URL
    },
    sokol: {
      url: process.env.SOKOL_RPC_URL
    }
  },
  gasReporter: {
    enabled: !!process.env.GASREPORT
  },
  etherscan: {
    apiKey: {
      kovan: process.env.FOREIGN_EXPLORER_API_KEY,
      sokol: 'This just has to be any non-empty string'
    }
  }
}
