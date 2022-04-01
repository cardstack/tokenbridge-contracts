require('@nomiclabs/hardhat-truffle5')
require('hardhat-contract-sizer')
require('hardhat-gas-reporter')
require('solidity-coverage')

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
    }
  },
  gasReporter: {
    enabled: !!process.env.GASREPORT
  }
}
