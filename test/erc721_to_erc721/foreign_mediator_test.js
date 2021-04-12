const ForeignMediator = artifacts.require('ForeignMediator.sol')
const HomeMediator = artifacts.require('HomeMediator.sol')
const SimpleBridgeKitty = artifacts.require('SimpleBridgeKitty.sol')
const AMBMock = artifacts.require('AMBMock.sol')

const { expect } = require('chai')
const { BN } = require('../setup')

const { expectEventInTransaction, expectRevert, getEvents } = require('../helpers/helpers')

const { shouldBehaveLikeBasicMediator } = require('./basic_mediator_test')

const {
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
  exampleTxHash
} = require('./helpers')

contract('ForeignMediator', accounts => {
  const owner = accounts[0]
  const user = accounts[1]
  beforeEach(async function() {
    this.bridge = await ForeignMediator.new()
    this.mediatorContractOnOtherSide = HomeMediator
  })
  shouldBehaveLikeBasicMediator(accounts)
  describe('transferToken', () => {
    it('should transfer tokens to mediator and emit event on amb bridge ', async () => {
      // Given
      const contract = await ForeignMediator.new()
      const bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      const token = await SimpleBridgeKitty.new()
      const mediatorContractOnOtherSide = await HomeMediator.new()

      await contract.initialize(
        bridgeContract.address,
        mediatorContractOnOtherSide.address,
        token.address,
        maxGasPerTx,
        owner
      )

      await token.mint(
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
        user,
        { from: owner }
      )

      // When
      // should approve the transfer first
      await expectRevert(contract.transferToken(user, tokenId, { from: user }))

      await token.approve(contract.address, tokenId, { from: user })

      const { tx } = await contract.transferToken(user, tokenId, { from: user })

      // Then
      await expectEventInTransaction(tx, SimpleBridgeKitty, 'Transfer', {
        from: user,
        to: contract.address,
        tokenId: new BN(tokenId)
      })
      await expectEventInTransaction(tx, AMBMock, 'MockedEvent')
    })
  })
  describe('handleBridgedTokens', () => {
    it('should transfer locked token', async () => {
      // Given
      const contract = await ForeignMediator.new()
      const bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      const token = await SimpleBridgeKitty.new()
      const mediatorContractOnOtherSide = await HomeMediator.new()

      await contract.initialize(
        bridgeContract.address,
        mediatorContractOnOtherSide.address,
        token.address,
        maxGasPerTx,
        owner
      )

      await token.mint(
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
        contract.address,
        { from: owner }
      )

      expect(await token.totalSupply()).to.be.bignumber.equal('1')
      expect(await token.ownerOf(tokenId)).to.be.equal(contract.address)

      // must be called from bridge
      await expectRevert(contract.handleBridgedTokens(user, tokenId, { from: user }))
      await expectRevert(contract.handleBridgedTokens(user, tokenId, { from: owner }))

      const data = await contract.contract.methods.handleBridgedTokens(user, tokenId).encodeABI()

      const failedTxHash = '0x2ebc2ccc755acc8eaf9252e19573af708d644ab63a39619adb080a3500a4ff2e'

      // message must be generated by mediator contract on the other network
      await bridgeContract.executeMessageCall(contract.address, owner, data, failedTxHash, 1000000)
      expect(await bridgeContract.messageCallStatus(failedTxHash)).to.be.equal(false)

      const { tx } = await bridgeContract.executeMessageCall(
        contract.address,
        mediatorContractOnOtherSide.address,
        data,
        exampleTxHash,
        1000000
      )
      expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(true)

      // Then
      expect(await token.totalSupply()).to.be.bignumber.equal('1')
      expect(await token.ownerOf(tokenId)).to.be.equal(user)

      await expectEventInTransaction(tx, SimpleBridgeKitty, 'Transfer', {
        from: contract.address,
        to: user,
        tokenId: new BN(tokenId)
      })
    })
  })
  describe('fixFailedMessage', () => {
    let bridgeContract
    let contract
    let mediatorContractOnOtherSide
    let token
    let transferMessageId

    beforeEach(async () => {
      bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      token = await SimpleBridgeKitty.new()

      contract = await ForeignMediator.new()
      mediatorContractOnOtherSide = await HomeMediator.new()

      await contract.initialize(
        bridgeContract.address,
        mediatorContractOnOtherSide.address,
        token.address,
        maxGasPerTx,
        owner
      )

      // User has a token
      await token.mint(
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
        user,
        { from: owner }
      )

      expect(await token.ownerOf(tokenId)).to.be.equal(user)
      // User transfer token to mediator and generate amb event
      await token.approve(contract.address, tokenId, { from: user })
      const { tx } = await contract.transferToken(user, tokenId, { from: user })
      expect(await token.ownerOf(tokenId)).to.be.equal(contract.address)

      const receipt = await web3.eth.getTransactionReceipt(tx)
      const logs = AMBMock.decodeLogs(receipt.logs)
      const data = `0x${logs[0].args.encodedData.substr(148, logs[0].args.encodedData.length - 148)}`

      // Bridge calls mediator from other side
      await bridgeContract.executeMessageCall(contract.address, mediatorContractOnOtherSide.address, data, tx, 100)
      // Message failed
      expect(await bridgeContract.messageCallStatus(tx)).to.be.equal(false)

      const events = await getEvents(bridgeContract, { event: 'MockedEvent' })
      expect(events.length).to.be.equal(1)
      transferMessageId = events[0].returnValues.messageId
    })

    it('should fix locked tokens', async () => {
      // Given
      expect(await contract.messageFixed(transferMessageId)).to.be.equal(false)

      // When
      const fixData = await contract.contract.methods.fixFailedMessage(transferMessageId).encodeABI()

      await bridgeContract.executeMessageCall(
        contract.address,
        mediatorContractOnOtherSide.address,
        fixData,
        exampleTxHash,
        1000000
      )

      // Then
      expect(await contract.messageFixed(transferMessageId)).to.be.equal(true)

      expect(await token.ownerOf(tokenId)).to.be.equal(user)

      const otherTxHash = '0x35d3818e50234655f6aebb2a1cfbf30f59568d8a4ec72066fac5a25dbe7b8121'
      // can only fix it one time
      await bridgeContract.executeMessageCall(
        contract.address,
        mediatorContractOnOtherSide.address,
        fixData,
        otherTxHash,
        1000000
      )
      expect(await bridgeContract.messageCallStatus(otherTxHash)).to.be.equal(false)

      // Re send token to know that dataHash is different even if same tokenId and metadata is used
      await token.approve(contract.address, tokenId, { from: user })
      const { tx } = await contract.transferToken(user, tokenId, { from: user })
      expect(await token.ownerOf(tokenId)).to.be.equal(contract.address)

      const receipt = await web3.eth.getTransactionReceipt(tx)
      const logs = AMBMock.decodeLogs(receipt.logs)
      const data = `0x${logs[0].args.encodedData.substr(148, logs[0].args.encodedData.length - 148)}`

      // Bridge calls mediator from other side
      await bridgeContract.executeMessageCall(contract.address, mediatorContractOnOtherSide.address, data, tx, 100)
      // Message failed
      expect(await bridgeContract.messageCallStatus(tx)).to.be.equal(false)

      const events = await getEvents(bridgeContract, { event: 'MockedEvent' })
      expect(events.length).to.be.equal(2)
      const newTransferMessageId = events[1].returnValues.messageId

      expect(newTransferMessageId).not.to.be.equal(transferMessageId)
    })

    it('should be called by bridge', async () => {
      await expectRevert(contract.fixFailedMessage(transferMessageId, { from: owner }))
    })

    it('message sender should be mediator from other side ', async () => {
      // Given
      expect(await contract.messageFixed(transferMessageId)).to.be.equal(false)

      // When
      const fixData = await contract.contract.methods.fixFailedMessage(transferMessageId).encodeABI()

      await bridgeContract.executeMessageCall(contract.address, contract.address, fixData, exampleTxHash, 1000000)

      // Then
      expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)
      expect(await contract.messageFixed(transferMessageId)).to.be.equal(false)
    })
  })
})
