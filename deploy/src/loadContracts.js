const hre = require('hardhat')

const homeContracts = getContracts()
const foreignContracts = getContracts()

function getContracts() {
  return {
    EternalStorageProxy: hre.artifacts.require('EternalStorageProxy'),
    BridgeValidators: hre.artifacts.require('BridgeValidators'),
    RewardableValidators: hre.artifacts.require('RewardableValidators'),
    FeeManagerErcToErcPOSDAO: hre.artifacts.require('FeeManagerErcToErcPOSDAO'),
    HomeBridgeErcToErc: hre.artifacts.require('HomeBridgeErcToErc'),
    ForeignBridgeErcToErc: hre.artifacts.require('ForeignBridgeErcToErc'),
    ForeignBridgeErc677ToErc677: hre.artifacts.require('ForeignBridgeErc677ToErc677'),
    HomeBridgeErcToErcPOSDAO: hre.artifacts.require('HomeBridgeErcToErcPOSDAO'),
    ERC677BridgeToken: hre.artifacts.require('ERC677BridgeToken'),
    ERC677BridgeTokenPermittable: hre.artifacts.require('PermittableToken'),
    ForeignBridgeErcToNative: hre.artifacts.require('ForeignBridgeErcToNative'),
    FeeManagerErcToNative: hre.artifacts.require('FeeManagerErcToNative'),
    FeeManagerErcToNativePOSDAO: hre.artifacts.require('FeeManagerErcToNativePOSDAO'),
    HomeBridgeErcToNative: hre.artifacts.require('HomeBridgeErcToNative'),
    FeeManagerNativeToErc: hre.artifacts.require('FeeManagerNativeToErc'),
    ForeignBridgeNativeToErc: hre.artifacts.require('ForeignBridgeNativeToErc'),
    FeeManagerNativeToErcBothDirections: hre.artifacts.require('FeeManagerNativeToErcBothDirections'),
    HomeBridgeNativeToErc: hre.artifacts.require('HomeBridgeNativeToErc'),
    BlockReward: hre.artifacts.require('BlockReward'),
    BlockRewardMock: hre.artifacts.require('BlockRewardMock'),
    BridgeUtilsMock: hre.artifacts.require('BridgeUtilsMock'),
    HomeAMB: hre.artifacts.require('HomeAMB'),
    ForeignAMB: hre.artifacts.require('ForeignAMB'),
    HomeAMBErc677ToErc677: hre.artifacts.require('HomeAMBErc677ToErc677'),
    ForeignAMBErc677ToErc677: hre.artifacts.require('ForeignAMBErc677ToErc677'),
    InterestReceiver: hre.artifacts.require('InterestReceiver'),
    HomeStakeTokenMediator: hre.artifacts.require('HomeStakeTokenMediator'),
    ForeignStakeTokenMediator: hre.artifacts.require('ForeignStakeTokenMediator'),
    ForeignAMBErc20ToNative: hre.artifacts.require('ForeignAMBErc20ToNative'),
    HomeAMBErc20ToNative: hre.artifacts.require('HomeAMBErc20ToNative'),
    ForeignMultiAMBErc20ToErc677: hre.artifacts.require('ForeignMultiAMBErc20ToErc677'),
    HomeMultiAMBErc20ToErc677: hre.artifacts.require('HomeMultiAMBErc20ToErc677')
  }
}

module.exports = {
  homeContracts,
  foreignContracts
}
