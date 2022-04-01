const { artifacts, web3 } = require('hardhat')

async function main() {
  let AMBMock = artifacts.require('AMBMock')
  let deployedAmbMock = await AMBMock.new()
  await deployedAmbMock.setMaxGasPerTx(web3.utils.toWei('1'))
  console.log('AMBMock address: ', deployedAmbMock.address)

  let BridgeUtilsMock = artifacts.require('BridgeUtilsMock')
  let accountTen = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' // default hardhat test account #10
  let deployedBridgeUtilsMock = await BridgeUtilsMock.new(accountTen)
  console.log('BridgeUtilsMock address: ', deployedBridgeUtilsMock.address)

  let ERC20Mock = artifacts.require('ERC20Mock')
  let card = await ERC20Mock.new('Cardstack', 'CARD', 18)
  let dai = await ERC20Mock.new('Dai Stablecoin', 'DAI', 18)
  console.log('Card address: ', card.address)
  console.log('Dai address: ', dai.address)
}

main()
  .catch(e => {
    console.log('Error:', e)
    process.exit(1)
  })
  .then(() => process.exit(0))
