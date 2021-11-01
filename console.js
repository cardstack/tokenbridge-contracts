const Web3 = require('web3')
const TrezorWalletProvider = require('trezor-cli-wallet-provider')
HOME_RPC_URL = 'https://sokol.poa.network'
HOME_CHAIN_ID = '77'
HOME_KEY_DERIVATION_PATH = "m/44'/60'/0'/0"
homeProvider = new TrezorWalletProvider(HOME_RPC_URL, {
  chainId: HOME_CHAIN_ID,
  derivationPathPrefix: HOME_KEY_DERIVATION_PATH,
  numberOfAccounts: 3
})
web3Home = new Web3(homeProvider)
ERC677BridgeTokenPermittable = require('/Users/alex/cardstack/tokenbridge-contracts/build/contracts/PermittableToken.json')
TokenProxy = require('/Users/alex/cardstack/tokenbridge-contracts/build/contracts/TokenProxy.json')
IBridgeMediator = require('/Users/alex/cardstack/tokenbridge-contracts/build/contracts/IBridgeMediator.json')
homeTokenAddress = '0xFeDc0c803390bbdA5C4C296776f4b574eC4F30D1'

newTokenImageAddress = '0xC5C8Bb531C23B5A4e7e669006c8BdAc5dB6d35Bd'

token = new web3Home.eth.Contract(ERC677BridgeTokenPermittable.abi, homeTokenAddress)

tokenAsProxy = new web3Home.eth.Contract(TokenProxy.abi, homeTokenAddress)

mediator = new web3Home.eth.Contract(IBridgeMediator.abi, '0x16a80598DD2f143CFBf091638CE3fB02c9135528')
