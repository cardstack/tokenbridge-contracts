require('@nomiclabs/hardhat-truffle5')
require('hardhat-contract-sizer')

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
  }
}
