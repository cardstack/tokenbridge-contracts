const { ether } = require('../helpers/helpers')

const maxGasPerTx = ether('1')
const tokenId = 1
const isReady = true
const cooldownIndex = 0
const nextActionAt = 2
const siringWithId = 3
const birthTime = 1511417999
const matronId = 4
const sireId = 5
const generation = 6
const genes = '623494533466173608148163391622294272936404886827521876326676079749575115'
const exampleTxHash = '0xf308b922ab9f8a7128d9d7bc9bce22cd88b2c05c8213f0e2d8104d78e0a9ecbb'
const metadata =
  '0x' +
  '0000000000000000000000000000000000000000000000000000000000000001' + // isGestating
  '0000000000000000000000000000000000000000000000000000000000000001' + // isReady
  '0000000000000000000000000000000000000000000000000000000000000000' + // cooldownIndex
  '0000000000000000000000000000000000000000000000000000000000000002' + // nextActionAt
  '0000000000000000000000000000000000000000000000000000000000000003' + // siringWithId
  '000000000000000000000000000000000000000000000000000000005a16688f' + // birthTime
  '0000000000000000000000000000000000000000000000000000000000000004' + // matronId
  '0000000000000000000000000000000000000000000000000000000000000005' + // sireId
  '0000000000000000000000000000000000000000000000000000000000000006' + // generation
  '00005a56b294e64a52e421c928c63218845adac30406314c739c454bd2e731cb' // genes
module.exports = {
  maxGasPerTx,
  tokenId,
  isReady,
  cooldownIndex,
  nextActionAt,
  siringWithId,
  birthTime,
  matronId,
  sireId,
  generation,
  genes,
  metadata,
  exampleTxHash
}
