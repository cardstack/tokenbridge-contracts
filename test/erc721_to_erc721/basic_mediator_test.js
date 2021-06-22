const ERC721BurnableMintable = artifacts.require('ERC721BurnableMintable.sol')
const AMBMock = artifacts.require('AMBMock.sol')

const { expect } = require('chai')

const { ZERO_ADDRESS } = require('../setup')

const { ether, expectRevert } = require('../helpers/helpers')

const { maxGasPerTx, tokenId, exampleTxHash, chainId } = require('./helpers')

function shouldBehaveLikeBasicMediator(accounts) {
  describe('shouldBehaveLikeBasicMediator', () => {
    let bridgeContract
    let erc721token
    const owner = accounts[0]
    describe('initialize', () => {
      beforeEach(async () => {
        bridgeContract = await AMBMock.new()
        await bridgeContract.setMaxGasPerTx(maxGasPerTx)
        erc721token = await ERC721BurnableMintable.new('TEST', 'TST', 123)
      })
      it('should initialize', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()

        expect(await contract.isInitialized()).to.be.equal(false)
        expect(await contract.bridgeContract()).to.be.equal(ZERO_ADDRESS)
        expect(await contract.mediatorContractOnOtherSide()).to.be.equal(ZERO_ADDRESS)
        expect(await contract.requestGasLimit()).to.be.bignumber.equal('0')
        expect(await contract.owner()).to.be.equal(ZERO_ADDRESS)

        // not valid bridge contract
        await expectRevert(contract.initialize(ZERO_ADDRESS, mediatorContractOnOtherSide.address, maxGasPerTx, owner))

        await contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)

        // already initialized
        await expectRevert(
          contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)
        )

        expect(await contract.isInitialized()).to.be.equal(true)
        expect(await contract.bridgeContract()).to.be.equal(bridgeContract.address)
        expect(await contract.mediatorContractOnOtherSide()).to.be.equal(mediatorContractOnOtherSide.address)
        expect(await contract.requestGasLimit()).to.be.bignumber.equal(maxGasPerTx)
        expect(await contract.owner()).to.be.equal(owner)
      })
      it('only owner can set bridge contract', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()
        const user = accounts[1]
        const notAContractAddress = accounts[2]

        await contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)

        expect(await contract.bridgeContract()).to.be.equal(bridgeContract.address)

        const newBridgeContract = await AMBMock.new()

        await expectRevert(contract.setBridgeContract(newBridgeContract.address, { from: user }))
        await expectRevert(contract.setBridgeContract(notAContractAddress, { from: owner }))

        await contract.setBridgeContract(newBridgeContract.address, { from: owner })
        expect(await contract.bridgeContract()).to.be.equal(newBridgeContract.address)
      })
      it('only owner can set mediator contract', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()
        const user = accounts[1]

        await contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)

        expect(await contract.bridgeContract()).to.be.equal(bridgeContract.address)

        const newMediatorContract = await this.mediatorContractOnOtherSide.new()

        await expectRevert(contract.setMediatorContractOnOtherSide(newMediatorContract.address, { from: user }))

        await contract.setMediatorContractOnOtherSide(newMediatorContract.address, { from: owner })
        expect(await contract.mediatorContractOnOtherSide()).to.be.equal(newMediatorContract.address)
      })
      it('only owner can set request Gas Limit', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()
        const user = accounts[1]

        await contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)

        expect(await contract.requestGasLimit()).to.be.bignumber.equal(maxGasPerTx)

        const newMaxGasPerTx = ether('0.5')
        const invalidMaxGasPerTx = ether('1.5')

        await expectRevert(contract.setRequestGasLimit(newMaxGasPerTx, { from: user }))

        // invalidMaxGasPerTx > bridgeContract.maxGasPerTx
        await expectRevert(contract.setRequestGasLimit(invalidMaxGasPerTx, { from: owner }))

        await contract.setRequestGasLimit(newMaxGasPerTx, { from: owner })
        expect(await contract.requestGasLimit()).to.be.bignumber.equal(newMaxGasPerTx)
      })
    })
    describe('getBridgeMode', () => {
      it('should return bridge mode and interface', async function() {
        const contract = this.bridge
        const bridgeModeHash = '0xca7fc3dc' // 4 bytes of keccak256('multi-nft-to-nft-amb')
        expect(await contract.getBridgeMode()).to.be.equal(bridgeModeHash)

        const { major, minor, patch } = await contract.getBridgeInterfacesVersion()
        expect(major).to.be.bignumber.gte('0')
        expect(minor).to.be.bignumber.gte('0')
        expect(patch).to.be.bignumber.gte('0')
      })
    })
    describe('requestFailedMessageFix', () => {
      let contract
      let mediatorContractOnOtherSide
      let data
      const user = accounts[1]
      beforeEach(async function() {
        bridgeContract = await AMBMock.new()
        await bridgeContract.setMaxGasPerTx(maxGasPerTx)
        erc721token = await ERC721BurnableMintable.new('TEST', 'TST', chainId)

        contract = this.bridge
        mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()

        await contract.initialize(bridgeContract.address, mediatorContractOnOtherSide.address, maxGasPerTx, owner)
        try {
          console.log('a')
          await erc721token.mint(user, tokenId, { from: owner })
          data = await this.handleBridgedTokensTx(user, erc721token.address, tokenId)
        } catch (e) {
          console.log('b')
          data = await this.handleBridgedTokensTx(user, erc721token.address, tokenId)
          await erc721token.transferOwnership(contract.address, { from: owner })
        }
      })
      it('should  allow to request a failed message fix', async () => {
        // Given
        await bridgeContract.executeMessageCall(
          contract.address,
          mediatorContractOnOtherSide.address,
          data,
          exampleTxHash,
          100
        )
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        const dataHash = await bridgeContract.failedMessageDataHash(exampleTxHash)

        // When
        const { tx } = await contract.requestFailedMessageFix(exampleTxHash)

        // Then
        const receipt = await web3.eth.getTransactionReceipt(tx)
        const logs = AMBMock.decodeLogs(receipt.logs)
        expect(logs.length).to.be.equal(1)
        expect(logs[0].args.encodedData.includes(dataHash.replace(/^0x/, ''))).to.be.equal(true)
      })
      it('should be a failed transaction', async () => {
        // Given
        // await erc721token.mint(user, tokenId, { from: owner })
        // await erc721token.transferOwnership(contract.address, { from: owner })

        // data = await this.handleBridgedTokensTx(user, erc721token.address, tokenId)

        const tokenURI = await erc721token.tokenURI(tokenId)
        console.log('tokenURI', tokenURI)
        // data = await contract.contract.methods.handleBridgedTokens(erc721token.address, erc721token.name(), erc721token.symbol(), user, tokenId, tokenURI).encodeABI()

        console.log('here', erc721token.address, erc721token.name(), erc721token.symbol(), user, tokenId, tokenURI)

        let { logs } = await contract.handleBridgedTokens(
          erc721token.address,
          erc721token.name(),
          erc721token.symbol(),
          user,
          tokenId,
          tokenURI
        )

        console.log('done', logs)

        // data = await this.handleBridgedTokensTx(user, erc721token.address, tokenId)
        // let {logs} = await bridgeContract.executeMessageCall(
        //   contract.address,
        //   mediatorContractOnOtherSide.address,
        //   data,
        //   exampleTxHash,
        //   1000000
        // )

        console.log(logs)

        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(true)

        // When
        // nocommit
        // await expectRevert(contract.requestFailedMessageFix(exampleTxHash))
      })
      it('should be the receiver of the failed transaction', async () => {
        // Given

        await bridgeContract.executeMessageCall(
          bridgeContract.address,
          mediatorContractOnOtherSide.address,
          data,
          exampleTxHash,
          1000000
        )
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        // When
        await expectRevert(contract.requestFailedMessageFix(exampleTxHash))
      })
      it('message sender should be mediator from other side', async () => {
        // Given
        await bridgeContract.executeMessageCall(contract.address, contract.address, data, exampleTxHash, 1000000)
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        // When
        await expectRevert(contract.requestFailedMessageFix(exampleTxHash))
      })
      it('should allow to request a fix multiple times', async () => {
        // Given
        await bridgeContract.executeMessageCall(
          contract.address,
          mediatorContractOnOtherSide.address,
          data,
          exampleTxHash,
          100
        )
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        const dataHash = await bridgeContract.failedMessageDataHash(exampleTxHash)

        const { tx } = await contract.requestFailedMessageFix(exampleTxHash)

        const receipt = await web3.eth.getTransactionReceipt(tx)
        const logs = AMBMock.decodeLogs(receipt.logs)
        expect(logs.length).to.be.equal(1)
        expect(logs[0].args.encodedData.includes(dataHash.replace(/^0x/, ''))).to.be.equal(true)

        // When
        const { tx: secondTx } = await contract.requestFailedMessageFix(exampleTxHash)

        // Then
        const secondReceipt = await web3.eth.getTransactionReceipt(secondTx)
        const secondLogs = AMBMock.decodeLogs(secondReceipt.logs)
        expect(secondLogs.length).to.be.equal(1)
        expect(secondLogs[0].args.encodedData.includes(dataHash.replace(/^0x/, ''))).to.be.equal(true)
      })
    })
  })
}

module.exports = {
  shouldBehaveLikeBasicMediator
}
