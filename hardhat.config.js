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
    }
  },
  gasReporter: {
    enabled: !!process.env.GASREPORT
  },
  etherscan: {
    apiKey: {
      kovan: 'This just has to be any non-empty string',
      sokol: 'This just has to be any non-empty string'
    }
  }
}
