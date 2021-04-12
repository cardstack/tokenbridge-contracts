const HomeMediator = artifacts.require('HomeMediator.sol')
const ForeignMediator = artifacts.require('ForeignMediator.sol')
const SimpleBridgeKitty = artifacts.require('SimpleBridgeKitty.sol')
const AMBMock = artifacts.require('AMBMock.sol')

// const { expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers')

const { expect } = require('chai')

const { getEvents, expectEventInTransaction, expectRevert } = require('../helpers/helpers')
const { BN } = require('../setup')

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
  metadata,
  exampleTxHash
} = require('./helpers')

contract('HomeMediator', accounts => {
  const owner = accounts[0]
  const user = accounts[1]
  beforeEach(async function() {
    this.bridge = await HomeMediator.new()
    this.mediatorContractOnOtherSide = ForeignMediator
  })
  shouldBehaveLikeBasicMediator(accounts)
  describe('transferToken', () => {
    it('should transfer token to mediator, burn the token and emit event on amb bridge ', async () => {
      // Given
      const contract = await HomeMediator.new()
      const bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      const token = await SimpleBridgeKitty.new()
      const mediatorContractOnOtherSide = await ForeignMediator.new()

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

      await token.transferBridgeRole(contract.address, { from: owner })

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
      await expectEventInTransaction(tx, SimpleBridgeKitty, 'Death', {
        kittyId: new BN(tokenId)
      })
      await expectEventInTransaction(tx, AMBMock, 'MockedEvent')
    })
  })
  describe('handleBridgedTokens', () => {
    it('should mint with token Id and metadata', async () => {
      // Given
      const contract = await HomeMediator.new()
      const bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      const token = await SimpleBridgeKitty.new()
      const mediatorContractOnOtherSide = await ForeignMediator.new()

      await contract.initialize(
        bridgeContract.address,
        mediatorContractOnOtherSide.address,
        token.address,
        maxGasPerTx,
        owner
      )

      await token.transferBridgeRole(contract.address, { from: owner })

      expect(await token.totalSupply()).to.be.bignumber.equal('0')

      // When

      // must be called from bridge
      await expectRevert(contract.handleBridgedTokens(user, tokenId, metadata, { from: user }))
      await expectRevert(contract.handleBridgedTokens(user, tokenId, metadata, { from: owner }))

      const data = await contract.contract.methods.handleBridgedTokens(user, tokenId, metadata).encodeABI()

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
      await expectEventInTransaction(tx, SimpleBridgeKitty, 'Birth', {
        owner: user,
        kittyId: new BN(tokenId),
        matronId: new BN(matronId),
        sireId: new BN(sireId),
        genes
      })
      expect(await token.totalSupply()).to.be.bignumber.equal('1')
      expect(await token.ownerOf(tokenId)).to.be.equal(user)
      const tokenList = await token.tokensOfOwner(user)
      expect(tokenList.length).to.be.equal(1)
      expect(tokenList[0]).to.be.bignumber.equal(new BN(tokenId))

      const mintedKitty = await token.getKitty(tokenId)

      expect(mintedKitty.isGestating).to.be.equal(true)
      expect(mintedKitty.isReady).to.be.equal(isReady)
      expect(mintedKitty.cooldownIndex).to.be.bignumber.equal(new BN(cooldownIndex))
      expect(mintedKitty.nextActionAt).to.be.bignumber.equal(new BN(nextActionAt))
      expect(mintedKitty.siringWithId).to.be.bignumber.equal(new BN(siringWithId))
      expect(mintedKitty.birthTime).to.be.bignumber.equal(new BN(birthTime))
      expect(mintedKitty.matronId).to.be.bignumber.equal(new BN(matronId))
      expect(mintedKitty.sireId).to.be.bignumber.equal(new BN(sireId))
      expect(mintedKitty.generation).to.be.bignumber.equal(new BN(generation))
      expect(mintedKitty.genes).to.be.bignumber.equal(new BN(genes))
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

      contract = await HomeMediator.new()
      mediatorContractOnOtherSide = await ForeignMediator.new()

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
      await token.transferBridgeRole(contract.address, { from: owner })

      expect(await token.ownerOf(tokenId)).to.be.equal(user)
      expect(await token.totalSupply()).to.be.bignumber.equal('1')
      // User transfer token to mediator, it burns the token and generate amb event
      await token.approve(contract.address, tokenId, { from: user })
      const { tx } = await contract.transferToken(user, tokenId, { from: user })
      await expectRevert(token.ownerOf(tokenId))
      expect(await token.totalSupply()).to.be.bignumber.equal('0')

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
    it('should fix burnt tokens', async () => {
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
      expect(await token.totalSupply()).to.be.bignumber.equal('1')
      const mintedKitty = await token.getKitty(tokenId)

      expect(mintedKitty.isGestating).to.be.equal(true)
      expect(mintedKitty.isReady).to.be.equal(isReady)
      expect(mintedKitty.cooldownIndex).to.be.bignumber.equal(new BN(cooldownIndex))
      expect(mintedKitty.nextActionAt).to.be.bignumber.equal(new BN(nextActionAt))
      expect(mintedKitty.siringWithId).to.be.bignumber.equal(new BN(siringWithId))
      expect(mintedKitty.birthTime).to.be.bignumber.equal(new BN(birthTime))
      expect(mintedKitty.matronId).to.be.bignumber.equal(new BN(matronId))
      expect(mintedKitty.sireId).to.be.bignumber.equal(new BN(sireId))
      expect(mintedKitty.generation).to.be.bignumber.equal(new BN(generation))
      expect(mintedKitty.genes).to.be.bignumber.equal(new BN(genes))

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
      expect(await token.totalSupply()).to.be.bignumber.equal('1')

      // Re send token to know that dataHash is different even if same tokenId and metadata is used
      await token.approve(contract.address, tokenId, { from: user })
      const { tx } = await contract.transferToken(user, tokenId, { from: user })
      await expectRevert(token.ownerOf(tokenId))
      expect(await token.totalSupply()).to.be.bignumber.equal('0')

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
      expect(await token.totalSupply()).to.be.bignumber.equal('0')
    })
  })
})
