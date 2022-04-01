const { BN } = web3.utils

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(BN))

const { should } = require('chai')

should()

exports.BN = BN
exports.toBN = web3.utils.toBN
exports.ERROR_MSG = 'Transaction reverted without a reason string'
exports.ERROR_MSG_OPCODE = 'Transaction reverted without a reason string'
exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
exports.F_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
exports.INVALID_ARGUMENTS = 'Invalid number of arguments to Solidity function'
