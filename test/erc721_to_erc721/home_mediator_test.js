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
  isReady,
  cooldownIndex,
  nextActionAt,
  siringWithId,
  birthTime,
  matronId,
  sireId,
  generation,
  genes,
  exampleTxHash,
  chainId,
  tokenURI,
  otherTokenURI
} = require('./helpers')

// address _tokenContractAddress,
// string _name,
// string _symbol,
// address _recipient,
// uint256 _tokenId,
// string _tokenURI

contract('HomeMediator', accounts => {
  const owner = accounts[0]
  const user = accounts[1]

  describe('Basic mediator', () => {
    beforeEach(async function() {
      this.bridge = await HomeMediator.new()
      this.mediatorContractOnOtherSide = ForeignMediator
      this.handleBridgedTokensTx = async function(user, tokenAddress, tokenId) {
        const token = await ERC721BurnableMintable.at(tokenAddress)
        console.log('tokenAddress', tokenAddress)
        console.log('tokenId', tokenId)
        const tokenURI = await token.tokenURI(tokenId)
        console.log('tokenURI', tokenURI)
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
  // describe('handleBridgedTokens', () => {
  //   it.only('should deploy a new contract the first time, and reuse it for the second transfer', async () => {
  //     // Given
  //     const contract = await HomeMediator.new()
  //     const bridgeContract = await AMBMock.new()
  //     await bridgeContract.setMaxGasPerTx(maxGasPerTx)

  //     const token = await ERC721BurnableMintable.new('Test on Foreign', 'TST', chainId)
  //     const tokenImage = await ERC721BurnableMintable.new('Token Image', 'IMG', chainId)

  //     const mediatorContractOnOtherSide = await ForeignMediator.new()

  //     await contract.initialize(
  //       bridgeContract.address,
  //       mediatorContractOnOtherSide.address,
  //       tokenImage.address,
  //       maxGasPerTx,
  //       owner
  //     )

  //     // When

  //     // must be called from bridge
  //     // await expectRevert(contract.handleBridgedTokens(user, tokenId, metadata, { from: user }))
  //     // await expectRevert(contract.handleBridgedTokens(user, tokenId, metadata, { from: owner }))

  //     const data = await contract.contract.methods.handleBridgedTokens(user, tokenId, metadata).encodeABI()

  //     const failedTxHash = '0x2ebc2ccc755acc8eaf9252e19573af708d644ab63a39619adb080a3500a4ff2e'

  //     // message must be generated by mediator contract on the other network
  //     await bridgeContract.executeMessageCall(contract.address, owner, data, failedTxHash, 1000000)
  //     expect(await bridgeContract.messageCallStatus(failedTxHash)).to.be.equal(false)

  //     const { tx } = await bridgeContract.executeMessageCall(
  //       contract.address,
  //       mediatorContractOnOtherSide.address,
  //       data,
  //       exampleTxHash,
  //       1000000
  //     )
  //     expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(true)

  //     // Then
  //     await expectEventInTransaction(tx, ERC721BurnableMintable, 'Birth', {
  //       owner: user,
  //       kittyId: new BN(tokenId),
  //       matronId: new BN(matronId),
  //       sireId: new BN(sireId),
  //       genes
  //     })
  //     expect(await token.totalSupply()).to.be.bignumber.equal('1')
  //     expect(await token.ownerOf(tokenId)).to.be.equal(user)
  //     const tokenList = await token.tokensOfOwner(user)
  //     expect(tokenList.length).to.be.equal(1)
  //     expect(tokenList[0]).to.be.bignumber.equal(new BN(tokenId))

  //     const mintedKitty = await token.getKitty(tokenId)

  //     expect(mintedKitty.isGestating).to.be.equal(true)
  //     expect(mintedKitty.isReady).to.be.equal(isReady)
  //     expect(mintedKitty.cooldownIndex).to.be.bignumber.equal(new BN(cooldownIndex))
  //     expect(mintedKitty.nextActionAt).to.be.bignumber.equal(new BN(nextActionAt))
  //     expect(mintedKitty.siringWithId).to.be.bignumber.equal(new BN(siringWithId))
  //     expect(mintedKitty.birthTime).to.be.bignumber.equal(new BN(birthTime))
  //     expect(mintedKitty.matronId).to.be.bignumber.equal(new BN(matronId))
  //     expect(mintedKitty.sireId).to.be.bignumber.equal(new BN(sireId))
  //     expect(mintedKitty.generation).to.be.bignumber.equal(new BN(generation))
  //     expect(mintedKitty.genes).to.be.bignumber.equal(new BN(genes))
  //   })
  // })
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
      console.log('bridgeToken', token.address, tokenId, tokenURI)
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

    // it('can be called only by mediator from the other side', async () => {
    //   await contract.deployAndHandleBridgedTokens(token.address, 'TOKEN', 'TOK', 18, user, value, { from: owner })
    //     .should.be.rejected
    //   const data = await contract.contract.methods
    //     .deployAndHandleBridgedTokens(token.address, 'TOKEN', 'TOK', 18, user, value.toString())
    //     .encodeABI()
    //   await ambBridgeContract.executeMessageCall(contract.address, owner, data, failedMessageId, 1000000).should.be
    //     .fulfilled
    //   expect(await ambBridgeContract.messageCallStatus(failedMessageId)).to.be.equal(false)
    //   await ambBridgeContract.executeMessageCall(
    //     contract.address,
    //     otherSideMediator.address,
    //     data,
    //     exampleMessageId,
    //     1000000
    //   ).should.be.fulfilled
    //   expect(await ambBridgeContract.messageCallStatus(exampleMessageId)).to.be.equal(true)
    // })

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
    })

    // it('should register new token with empty name', async () => {
    //   token = await ERC677BridgeToken.new('', 'TST', 18)
    //   await otherSideMediator.allowToken(token.address).should.be.fulfilled

    //   const homeToken = await bridgeToken(token)

    //   expect(await homeToken.name()).to.be.equal('TST.CPXD')
    //   expect(await homeToken.symbol()).to.be.equal('TST')
    //   expect(await homeToken.decimals()).to.be.bignumber.equal('18')
    // })

    // it('should register new token with empty symbol', async () => {
    //   token = await ERC677BridgeToken.new('TEST', '', 18)
    //   await otherSideMediator.allowToken(token.address).should.be.fulfilled

    //   const homeToken = await bridgeToken(token)

    //   expect(await homeToken.name()).to.be.equal('TEST.CPXD')
    //   expect(await homeToken.symbol()).to.be.equal('TEST')
    //   expect(await homeToken.decimals()).to.be.bignumber.equal('18')
    // })

    // it('should not register new token with empty name and empty symbol', async () => {
    //   const data1 = await contract.contract.methods
    //     .deployAndHandleBridgedTokens(accounts[0], '', '', 18, user, oneEther.toString(10))
    //     .encodeABI()
    //   await ambBridgeContract.executeMessageCall(
    //     contract.address,
    //     otherSideMediator.address,
    //     data1,
    //     exampleMessageId,
    //     2000000
    //   ).should.be.fulfilled

    //   expect(await ambBridgeContract.messageCallStatus(exampleMessageId)).to.be.equal(false)

    //   const data2 = await contract.contract.methods
    //     .deployAndHandleBridgedTokens(accounts[1], 'TEST', '', 18, user, oneEther.toString(10))
    //     .encodeABI()
    //   await ambBridgeContract.executeMessageCall(
    //     contract.address,
    //     otherSideMediator.address,
    //     data2,
    //     otherMessageId,
    //     2000000
    //   ).should.be.fulfilled

    //   expect(await ambBridgeContract.messageCallStatus(otherMessageId)).to.be.equal(true)
    // })

    // for (const decimals of [3, 18, 20]) {
    //   it(`should initialize limits according to decimals = ${decimals}`, async () => {
    //     const f1 = toBN(`1${'0'.repeat(decimals)}`)
    //     const f2 = toBN('1000000000000000000')

    //     token = await ERC677BridgeToken.new('TEST', 'TST', decimals)
    //     await otherSideMediator.allowToken(token.address).should.be.fulfilled
    //     token = await bridgeToken(token, value.mul(f1).div(f2))

    //     expect(await token.decimals()).to.be.bignumber.equal(decimals.toString())
    //     expect(await contract.dailyLimit(token.address)).to.be.bignumber.equal(dailyLimit.mul(f1).div(f2))
    //     expect(await contract.maxPerTx(token.address)).to.be.bignumber.equal(maxPerTx.mul(f1).div(f2))
    //     expect(await contract.minPerTx(token.address)).to.be.bignumber.equal(minPerTx.mul(f1).div(f2))
    //     expect(await contract.executionDailyLimit(token.address)).to.be.bignumber.equal(
    //       executionDailyLimit.mul(f1).div(f2)
    //     )
    //     expect(await contract.executionMaxPerTx(token.address)).to.be.bignumber.equal(executionMaxPerTx.mul(f1).div(f2))
    //   })
    // }

    // it(`should initialize limits according to decimals = 0`, async () => {
    //   token = await ERC677BridgeToken.new('TEST', 'TST', 0)
    //   await otherSideMediator.allowToken(token.address).should.be.fulfilled
    //   token = await bridgeToken(token, '1')

    //   expect(await token.decimals()).to.be.bignumber.equal('0')
    //   expect(await contract.dailyLimit(token.address)).to.be.bignumber.equal('10000')
    //   expect(await contract.maxPerTx(token.address)).to.be.bignumber.equal('100')
    //   expect(await contract.minPerTx(token.address)).to.be.bignumber.equal('1')
    //   expect(await contract.executionDailyLimit(token.address)).to.be.bignumber.equal('10000')
    //   expect(await contract.executionMaxPerTx(token.address)).to.be.bignumber.equal('100')
    // })

    // it('should initialize fees', async () => {
    //   const HOME_TO_FOREIGN_FEE = await contract.HOME_TO_FOREIGN_FEE()
    //   const FOREIGN_TO_HOME_FEE = await contract.FOREIGN_TO_HOME_FEE()
    //   await contract.setFee(HOME_TO_FOREIGN_FEE, ZERO_ADDRESS, ether('0.01'))
    //   await contract.setFee(FOREIGN_TO_HOME_FEE, ZERO_ADDRESS, ether('0.02'))

    //   expect(await contract.getFee(HOME_TO_FOREIGN_FEE, ZERO_ADDRESS)).to.be.bignumber.equal(ether('0.01'))
    //   expect(await contract.getFee(FOREIGN_TO_HOME_FEE, ZERO_ADDRESS)).to.be.bignumber.equal(ether('0.02'))
    //   expect(await contract.getFee(HOME_TO_FOREIGN_FEE, token.address)).to.be.bignumber.equal(ZERO)
    //   expect(await contract.getFee(FOREIGN_TO_HOME_FEE, token.address)).to.be.bignumber.equal(ZERO)

    //   const homeToken = await bridgeToken(token)

    //   expect(await contract.getFee(HOME_TO_FOREIGN_FEE, ZERO_ADDRESS)).to.be.bignumber.equal(ether('0.01'))
    //   expect(await contract.getFee(FOREIGN_TO_HOME_FEE, ZERO_ADDRESS)).to.be.bignumber.equal(ether('0.02'))
    //   expect(await contract.getFee(HOME_TO_FOREIGN_FEE, homeToken.address)).to.be.bignumber.equal(ether('0.01'))
    //   expect(await contract.getFee(FOREIGN_TO_HOME_FEE, homeToken.address)).to.be.bignumber.equal(ether('0.02'))
    // })
  })
  describe.skip('fixFailedMessage', () => {
    let bridgeContract
    let contract
    let mediatorContractOnOtherSide
    let token
    let transferMessageId
    beforeEach(async () => {
      bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      token = await ERC721BurnableMintable.new('TEST', 'TST', chainId)

      contract = await HomeMediator.new()
      mediatorContractOnOtherSide = await ForeignMediator.new()

      await contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)

      await token.mint(user, tokenId, { from: owner })

      await token.transferOwnership(contract.address, { from: owner })

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

  // nocommit test updating token image
})
