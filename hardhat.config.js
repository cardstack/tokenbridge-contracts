/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@nomiclabs/hardhat-truffle5')

module.exports = {
  solidity: {
    version: '0.4.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: 'byzantium'
    }
  }
}
