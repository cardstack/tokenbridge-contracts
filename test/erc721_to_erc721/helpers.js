const { ether } = require('../helpers/helpers')

const maxGasPerTx = ether('1')
const tokenId = 456
const otherTokenId = 789
const failedMessageId = '0x2ebc2ccc755acc8eaf9252e19573af708d644ab63a39619adb080a3500a4ff2e'
const exampleMessageId = '0xf308b922ab9f8a7128d9d7bc9bce22cd88b2c05c8213f0e2d8104d78e0a9ecbb'

const tokenURI = 'https://example.com/token.json'
const otherTokenURI = 'https://example.com/other-token.json'

module.exports = {
  maxGasPerTx,
  tokenId,
  otherTokenId,
  exampleMessageId,
  tokenURI,
  otherTokenURI,
  failedMessageId
}
