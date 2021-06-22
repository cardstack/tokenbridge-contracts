const HomeMediator = artifacts.require('HomeMediator.sol')
const ForeignMediator = artifacts.require('ForeignMediator.sol')
const ERC721BurnableMintable = artifacts.require('ERC721BurnableMintable.sol')
const AMBMock = artifacts.require('AMBMock.sol')

// const { expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers')

const { expect } = require('chai')

const { getEvents, expectEventInTransaction, expectRevert, strip0x } = require('../helpers/helpers')
const { BN, ZERO_ADDRESS } = require('../setup')

const { shouldBehaveLikeBasicMediator } = require('./basic_mediator_test')

const {
  maxGasPerTx,
  tokenId,
  otherTokenId,
  exampleTxHash,
  chainId,
  tokenURI,
  otherTokenURI,
  failedMessageId
} = require('./helpers')

contract('HomeMediator', accounts => {
  const owner = accounts[0]
  const user = accounts[1]

  describe('Basic mediator', () => {
    beforeEach(async function() {
      this.bridge = await HomeMediator.new()
      this.mediatorContractOnOtherSide = ForeignMediator
      this.handleBridgedTokensTx = async function(user, tokenAddress, tokenId) {
        const token = await ERC721BurnableMintable.at(tokenAddress)
        const tokenURI = await token.tokenURI(tokenId)
        return this.bridge.contract.methods
          .handleBridgedTokens(tokenAddress, token.name(), token.symbol(), user, tokenId, tokenURI)
          .encodeABI()
      }
    })
    shouldBehaveLikeBasicMediator(accounts)
  })

  describe('transferToken', () => {
    it('should transfer token to mediator, burn the token and emit event on amb bridge ', async () => {
      // Given
      const contract = await HomeMediator.new()
      const bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      const token = await ERC721BurnableMintable.new('TEST', 'TST', chainId)
      const mediatorContractOnOtherSide = await ForeignMediator.new()

      await contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)

      await token.mint(user, tokenId, { from: owner })

      await token.transferOwnership(contract.address, { from: owner })

      // When
      // should approve the transfer first
      await expectRevert(contract.transferToken(token.address, user, tokenId, { from: user }))

      await token.approve(contract.address, tokenId, { from: user })

      const { tx } = await contract.transferToken(token.address, user, tokenId, { from: user })

      // Then
      await expectEventInTransaction(tx, ERC721BurnableMintable, 'Transfer', {
        _from: user,
        _to: contract.address,
        _tokenId: new BN(tokenId)
      })

      await expectEventInTransaction(tx, ERC721BurnableMintable, 'Transfer', {
        _from: contract.address,
        _to: ZERO_ADDRESS,
        _tokenId: new BN(tokenId)
      })

      await expectEventInTransaction(tx, AMBMock, 'MockedEvent')
    })
  })

  describe('deploy and register new token', () => {
    let contract
    let bridgeContract
    let tokenOnForeign
    let tokenImage
    let otherSideAMBBridgeContract
    let mediatorContractOnOtherSide

    beforeEach(async () => {
      contract = await HomeMediator.new()
      bridgeContract = await AMBMock.new()
      bridgeContract.setMaxGasPerTx(maxGasPerTx)

      otherSideAMBBridgeContract = await AMBMock.new()
      otherSideAMBBridgeContract.setMaxGasPerTx(maxGasPerTx)

      tokenOnForeign = await ERC721BurnableMintable.new('Test on Foreign', 'TST', chainId)
      tokenImage = await ERC721BurnableMintable.new('Token Image', 'IMG', chainId)

      mediatorContractOnOtherSide = await ForeignMediator.new()

      await contract.initialize(
        bridgeContract.address,
        mediatorContractOnOtherSide.address,
        tokenImage.address,
        maxGasPerTx,
        owner
      )

      await mediatorContractOnOtherSide.initialize(
        otherSideAMBBridgeContract.address,
        contract.address,
        maxGasPerTx,
        owner
      )
    })

    async function bridgeToken(token, tokenId, tokenURI) {
      await token.mint(user, tokenId).should.be.fulfilled
      await token.setTokenURI(tokenId, tokenURI).should.be.fulfilled
      await token.approve(mediatorContractOnOtherSide.address, tokenId, { from: user }).should.be.fulfilled

      expect(await token.tokenURI(tokenId)).to.be.equal(tokenURI)

      const { receipt } = await mediatorContractOnOtherSide.transferToken(token.address, user, tokenId, { from: user })

      const encodedData = strip0x(
        web3.eth.abi.decodeParameters(
          ['bytes'],
          receipt.rawLogs.find(log => log.address === otherSideAMBBridgeContract.address).data
        )[0]
      )

      const data = `0x${encodedData.slice(2 * (4 + 20 + 8 + 20 + 20 + 4 + 1 + 1 + 1 + 2 + 2))}` // remove AMB header
      await bridgeContract.executeMessageCall(
        contract.address,
        mediatorContractOnOtherSide.address,
        data,
        exampleTxHash,
        2000000
      ).should.be.fulfilled

      expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(true)
    }

    async function bridgedTokenContract(foreignToken) {
      const homeTokenAddress = await contract.homeTokenAddress(foreignToken.address)
      return ERC721BurnableMintable.at(homeTokenAddress)
    }

    it('can be called only by mediator from the other side', async () => {
      await contract.handleBridgedTokens(tokenOnForeign.address, 'TOKEN', 'TOK', user, tokenId, tokenURI, {
        from: owner
      }).should.be.rejected

      const data = await contract.contract.methods
        .handleBridgedTokens(tokenOnForeign.address, 'TOKEN', 'TOK', user, tokenId, tokenURI)
        .encodeABI()

      await bridgeContract.executeMessageCall(contract.address, owner, data, failedMessageId, 1000000).should.be
        .fulfilled
      expect(await bridgeContract.messageCallStatus(failedMessageId)).to.be.equal(false)
      await bridgeContract.executeMessageCall(
        contract.address,
        mediatorContractOnOtherSide.address,
        data,
        exampleTxHash,
        1000000
      ).should.be.fulfilled
      expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(true)
    })

    it('should register new token in deployAndHandleBridgedTokens, and reuse the deployed token contract for subsequent transfers', async () => {
      await bridgeToken(tokenOnForeign, tokenId, tokenURI)

      let events = await getEvents(contract, { event: 'NewTokenRegistered' })
      expect(events.length).to.be.equal(1)
      expect(events[0].returnValues.foreignToken).to.be.equal(tokenOnForeign.address)
      const homeToken = await ERC721BurnableMintable.at(events[0].returnValues.homeToken)

      expect(await homeToken.name()).to.be.equal('Test on Foreign.CPXD')
      expect(await homeToken.symbol()).to.be.equal('TST')
      expect(await homeToken.version()).to.be.equal('1')
      expect(await homeToken.owner()).to.be.equal(contract.address)
      expect(await homeToken.totalSupply()).to.be.bignumber.equal('1')
      expect(await homeToken.balanceOf(user)).to.be.bignumber.equal('1')
      expect(await homeToken.ownerOf(tokenId)).to.equal(user)
      expect(await homeToken.tokenURI(tokenId)).to.equal(tokenURI)
      expect(await contract.homeTokenAddress(tokenOnForeign.address)).to.be.equal(homeToken.address)
      expect(await contract.foreignTokenAddress(homeToken.address)).to.be.equal(tokenOnForeign.address)

      // briding same token contract again should not deploy again
      await bridgeToken(tokenOnForeign, otherTokenId, otherTokenURI)

      events = await getEvents(contract, { event: 'NewTokenRegistered' })
      expect(events.length).to.be.equal(1)
      expect(events[0].returnValues.foreignToken).to.be.equal(tokenOnForeign.address)

      expect(await homeToken.name()).to.be.equal('Test on Foreign.CPXD')
      expect(await homeToken.symbol()).to.be.equal('TST')
      expect(await homeToken.version()).to.be.equal('1')
      expect(await homeToken.owner()).to.be.equal(contract.address)
      expect(await homeToken.totalSupply()).to.be.bignumber.equal('2')
      expect(await homeToken.balanceOf(user)).to.be.bignumber.equal('2')
      expect(await homeToken.ownerOf(tokenId)).to.equal(user)
      expect(await homeToken.ownerOf(otherTokenId)).to.equal(user)
      expect(await homeToken.tokenURI(tokenId)).to.equal(tokenURI)
      expect(await homeToken.tokenURI(otherTokenId)).to.equal(otherTokenURI)
      expect(await contract.homeTokenAddress(tokenOnForeign.address)).to.be.equal(homeToken.address)
      expect(await contract.foreignTokenAddress(homeToken.address)).to.be.equal(tokenOnForeign.address)

      // doesn't allow fixing a non-failed message
      await expectRevert(contract.requestFailedMessageFix(exampleTxHash))
    })

    it('should register new token with empty name', async () => {
      const newToken = await ERC721BurnableMintable.new('', 'TST', chainId)

      await bridgeToken(newToken, tokenId, tokenURI)

      const homeToken = await bridgedTokenContract(newToken)

      expect(await homeToken.name()).to.be.equal('TST.CPXD')
      expect(await homeToken.symbol()).to.be.equal('TST')
    })

    it('should register new token with empty symbol', async () => {
      const newToken = await ERC721BurnableMintable.new('Test on Foreign', '', chainId)

      await bridgeToken(newToken, tokenId, tokenURI)

      const homeToken = await bridgedTokenContract(newToken)

      expect(await homeToken.name()).to.be.equal('Test on Foreign.CPXD')
      expect(await homeToken.symbol()).to.be.equal('Test on Foreign')
    })

    describe('fixFailedMessage', () => {
      let homeToken
      let transferMessageId

      beforeEach(async () => {
        homeToken = await ERC721BurnableMintable.new('TEST', 'TST', chainId)
        await homeToken.mint(user, tokenId, { from: owner })
        await homeToken.setTokenURI(tokenId, tokenURI).should.be.fulfilled
        await homeToken.transferOwnership(contract.address, { from: owner })
        expect(await homeToken.ownerOf(tokenId)).to.be.equal(user)
        expect(await homeToken.totalSupply()).to.be.bignumber.equal('1')
        // User transfer token to mediator, it burns the token and generate amb event
        await homeToken.approve(contract.address, tokenId, { from: user })
        const { tx } = await contract.transferToken(homeToken.address, user, tokenId, { from: user })
        await expectRevert(homeToken.ownerOf(tokenId))
        expect(await homeToken.totalSupply()).to.be.bignumber.equal('0')

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
        expect(await homeToken.ownerOf(tokenId)).to.be.equal(user)
        expect(await homeToken.totalSupply()).to.be.bignumber.equal('1')
        expect(await homeToken.tokenURI(tokenId)).to.be.equal(tokenURI)

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
        expect(await homeToken.totalSupply()).to.be.bignumber.equal('1')

        // Re send token to know that dataHash is different even if same tokenId and metadata is used
        await homeToken.approve(contract.address, tokenId, { from: user })
        const { tx } = await contract.transferToken(homeToken.address, user, tokenId, { from: user })
        await expectRevert(homeToken.ownerOf(tokenId))
        expect(await homeToken.totalSupply()).to.be.bignumber.equal('0')

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
        expect(await homeToken.totalSupply()).to.be.bignumber.equal('0')
      })
    })
  })

  // nocommit test updating token image
})
