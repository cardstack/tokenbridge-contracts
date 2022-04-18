const PermittableToken = artifacts.require('PermittableToken.sol')
const HomeBridgeErcToErcMock = artifacts.require('HomeBridgeErcToErcMock.sol')
const ERC721BurnableMintable = artifacts.require('ERC721BurnableMintable.sol')

const { expect } = require('chai')

contract('Bridged Tokens', async accounts => {
  const [owner, deployer] = accounts
  contract('PermittableToken', async () => {
    it('can deploy the implementation without a proxy using the constructor', async function() {
      const token = await PermittableToken.new('Test Token', 'TEST', 18, { from: deployer })
      expect(await token.name()).to.eq('Test Token')
      expect(await token.symbol()).to.eq('TEST')
      expect(await token.decimals()).to.be.bignumber.eq('18')
      expect(await token.owner()).to.eq(deployer)
      expect(await token.bridgeContractAddr()).to.eq(deployer)

      expect(token.initialize('foo', 'bar', '123')).to.be.rejectedWith('already initialized')
    })

    it('can deploy the implementation as a proxy', async () => {
      const implementation = await PermittableToken.new('IMPL', 'IMPL', 0)
      const homeBridge = await HomeBridgeErcToErcMock.new()
      await homeBridge.setTokenImage(implementation.address)
      const {
        logs: [
          {
            args: { proxy: tokenProxyAddress }
          }
        ]
      } = await homeBridge.deployTokenProxy('Test Token', 'TEST', 18)
      const token = await PermittableToken.at(tokenProxyAddress)
      expect(await token.name()).to.eq('Test Token')
      expect(await token.symbol()).to.eq('TEST')
      expect(await token.decimals()).to.be.bignumber.eq('18')
      expect(await token.owner()).to.eq(homeBridge.address)
      expect(await token.bridgeContractAddr()).to.eq(homeBridge.address)

      // Verify that storage slot 7 contains the bridge contract address, as this value is hardcoded in the token proxy.
      // This is required to support already deployed token images and should be maintained permanently
      const bridgeContractStorage = `0x${(await web3.eth.getStorageAt(token.address, '7')).slice(26)}`
      expect(bridgeContractStorage).to.eq(homeBridge.address.toLowerCase())

      expect(token.initialize('foo', 'bar', '123')).to.be.rejectedWith('already initialized')
    })

    it('cannot change ownership', async () => {
      const token = await PermittableToken.new('Test Token', 'TEST', 18, { from: deployer })
      await expect(token.transferOwnership(owner, { from: deployer })).to.be.rejected
    })
  })

  contract('ERC721BurnableMintable', async () => {
    it('can deploy the implementation without a proxy using the constructor', async function() {
      const token = await ERC721BurnableMintable.new('Test NFT', 'NFT', { from: deployer })
      expect(await token.name()).to.eq('Test NFT')
      expect(await token.symbol()).to.eq('NFT')
      expect(await token.owner()).to.eq(deployer)
      const ownerStorage = `0x${(
        await web3.eth.getStorageAt(token.address, '0x02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040bf')
      ).slice(26)}`
      expect(ownerStorage).to.eq(deployer.toLowerCase())

      expect(token.initialize('foo', 'bar')).to.be.rejectedWith('already initialized')
    })

    it('can deploy the implementation as a proxy', async () => {
      const implementation = await ERC721BurnableMintable.new('IMPL', 'IMPL')
      const homeBridge = await HomeBridgeErcToErcMock.new()
      await homeBridge.setTokenImage(implementation.address)
      const {
        logs: [
          {
            args: { proxy: tokenProxyAddress }
          }
        ]
      } = await homeBridge.deployTokenProxyERC721('Test NFT', 'NFT')
      const token = await PermittableToken.at(tokenProxyAddress)
      expect(await token.name()).to.eq('Test NFT')
      expect(await token.symbol()).to.eq('NFT')
      expect(await token.owner()).to.eq(homeBridge.address)

      const ownerStorage = `0x${(
        await web3.eth.getStorageAt(token.address, '0x02016836a56b71f0d02689e69e326f4f4c1b9057164ef592671cf0d37c8040bf')
      ).slice(26)}`
      expect(ownerStorage).to.eq(homeBridge.address.toLowerCase())

      expect(token.initialize('foo', 'bar')).to.be.rejectedWith('already initialized')
    })
  })
})
