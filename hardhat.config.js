/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@nomiclabs/hardhat-truffle5')

task('accounts', 'Prints the list of accounts', async () => {
  let chainId = await web3.eth.getChainId()
  console.log('Chain id', chainId)
  for (let account of await web3.eth.getAccounts()) {
    console.log(account, await web3.eth.getBalance(account))
  }

  // const accounts = await ethers.getSigners()

  // for (const account of accounts) {
  //   console.log(account.address)
  // }
})

module.exports = {
  solidity: {
    version: '0.5.5',
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      },
      evmVersion: 'constantinople'
    }
  },
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209',
          balance: '1000000000000000000000000'
        },
        {
          privateKey: '0x19fba401d77e4113b15095e9aa7117bcd25adcfac7f6111f8298894eef443600',
          balance: '1000000000000000000000000'
        }
      ]
    }
  }
}
