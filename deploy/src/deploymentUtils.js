/* eslint-disable no-param-reassign */
const BigNumber = require('bignumber.js')
const Web3Utils = require('web3-utils')
const fetch = require('node-fetch')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const {
  web3Home,
  web3Foreign,
  FOREIGN_RPC_URL,
  HOME_RPC_URL,
  GAS_LIMIT_EXTRA,
  HOME_DEPLOYMENT_GAS_PRICE,
  FOREIGN_DEPLOYMENT_GAS_PRICE,
  GET_RECEIPT_INTERVAL_IN_MILLISECONDS,
  HOME_EXPLORER_URL,
  FOREIGN_EXPLORER_URL,
  HOME_EXPLORER_API_KEY,
  FOREIGN_EXPLORER_API_KEY,
  HOME_DEPLOYMENT_ACCOUNT_ADDRESS,
  FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS
} = require('./web3')
const verifier = require('./utils/verifier')

async function deployContract(contractJson, args, { network, nonce }) {
  let web3
  let gasPrice
  let apiUrl
  let apiKey
  let deploymentAccountAddress
  if (network === 'foreign') {
    web3 = web3Foreign
    gasPrice = FOREIGN_DEPLOYMENT_GAS_PRICE
    apiUrl = FOREIGN_EXPLORER_URL
    apiKey = FOREIGN_EXPLORER_API_KEY
    deploymentAccountAddress = FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS
  } else {
    web3 = web3Home
    gasPrice = HOME_DEPLOYMENT_GAS_PRICE
    apiUrl = HOME_EXPLORER_URL
    apiKey = HOME_EXPLORER_API_KEY
    deploymentAccountAddress = HOME_DEPLOYMENT_ACCOUNT_ADDRESS
  }
  const Contract = new web3.eth.Contract(contractJson.abi)

  const instance = await Contract.deploy({
    data: contractJson.bytecode,
    arguments: args
  }).send({
    from: deploymentAccountAddress,
    gasPrice,
    nonce
  })

  return instance
}

async function sendRawTxHome(options) {
  return sendRawTx({
    ...options,
    gasPrice: HOME_DEPLOYMENT_GAS_PRICE
  })
}

async function sendRawTxForeign(options) {
  return sendRawTx({
    ...options,
    gasPrice: FOREIGN_DEPLOYMENT_GAS_PRICE
  })
}

async function sendRawTx({ data, nonce, to, from, url, gasPrice, value }) {
  try {
    const txToEstimateGas = {
      from,
      value,
      to,
      data
    }
    const estimatedGas = BigNumber(await sendNodeRequest(url, 'eth_estimateGas', txToEstimateGas))

    const blockData = await sendNodeRequest(url, 'eth_getBlockByNumber', ['latest', false])
    const blockGasLimit = BigNumber(blockData.gasLimit)
    if (estimatedGas.isGreaterThan(blockGasLimit)) {
      throw new Error(
        `estimated gas greater (${estimatedGas.toString()}) than the block gas limit (${blockGasLimit.toString()})`
      )
    }
    let gas = estimatedGas.multipliedBy(BigNumber(1 + GAS_LIMIT_EXTRA))
    if (gas.isGreaterThan(blockGasLimit)) {
      gas = blockGasLimit
    } else {
      gas = gas.toFixed(0)
    }

    const rawTx = {
      nonce,
      gasPrice: Web3Utils.toHex(gasPrice),
      gasLimit: Web3Utils.toHex(gas),
      from,
      to,
      data,
      value
    }

    if (rawTx.to === null) {
      rawTx.to = ''
    }

    const provider = getWeb3Provider(url)

    console.log('Signing transaction…', { rawTx })

    const signedTransaction = await provider.eth.signTransaction(rawTx)
    const txHash = await sendNodeRequest(url, 'eth_sendRawTransaction', signedTransaction.raw)

    console.log('pending txHash', txHash)
    return await getReceipt(txHash, url)
  } catch (e) {
    console.error(e)
    throw e
  }
}

async function sendNodeRequest(url, method, signedData) {
  if (!Array.isArray(signedData)) {
    signedData = [signedData]
  }
  const request = await fetch(url, {
    headers: {
      'Content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params: signedData,
      id: 1
    })
  })
  const json = await request.json()
  if (typeof json.error === 'undefined' || json.error === null) {
    if (method === 'eth_sendRawTransaction') {
      assert.strictEqual(json.result.length, 66, `Tx wasn't sent ${json}`)
    }
    return json.result
  }
  throw new Error(`web3 RPC failed: ${JSON.stringify(json.error)}`)
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getReceipt(txHash, url) {
  await timeout(GET_RECEIPT_INTERVAL_IN_MILLISECONDS)
  let receipt = await sendNodeRequest(url, 'eth_getTransactionReceipt', txHash)
  if (receipt === null || receipt.blockNumber === null) {
    receipt = await getReceipt(txHash, url)
  }
  return receipt
}

function logValidatorsAndRewardAccounts(validators, rewards) {
  console.log(`VALIDATORS\n==========`)
  validators.forEach((validator, index) => {
    console.log(`${index + 1}: ${validator}, reward address ${rewards[index]}`)
  })
}

async function upgradeProxy({ proxy, implementationAddress, version, nonce, url }) {
  const data = await proxy.methods.upgradeTo(version, implementationAddress).encodeABI()
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: proxy.options.address,
    from: getDeploymentAccountAddress(url),
    url
  })
  if (result.status) {
    assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
  } else {
    await assertStateWithRetry(proxy.methods.implementation().call, implementationAddress)
  }
}

async function transferProxyOwnership({ proxy, newOwner, nonce, url }) {
  const data = await proxy.methods.transferProxyOwnership(newOwner).encodeABI()
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: proxy.options.address,
    from: getDeploymentAccountAddress(url),
    url
  })
  if (result.status) {
    assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
  } else {
    await assertStateWithRetry(proxy.methods.proxyOwner().call, newOwner)
  }
}

async function transferOwnership({ contract, newOwner, nonce, url }) {
  const data = await contract.methods.transferOwnership(newOwner).encodeABI()
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: contract.options.address,
    from: getDeploymentAccountAddress(url),
    url
  })
  if (result.status) {
    assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
  } else {
    await assertStateWithRetry(contract.methods.owner().call, newOwner)
  }
}

async function setBridgeContract({ contract, bridgeAddress, nonce, url }) {
  const data = await contract.methods.setBridgeContract(bridgeAddress).encodeABI()
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: contract.options.address,
    from: getDeploymentAccountAddress(url),
    url
  })
  if (result.status) {
    assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
  } else {
    await assertStateWithRetry(contract.methods.bridgeContract().call, bridgeAddress)
  }
}

async function initializeValidators({
  contract,
  isRewardableBridge,
  requiredNumber,
  validators,
  rewardAccounts,
  owner,
  nonce,
  url
}) {
  let data

  if (isRewardableBridge) {
    console.log(`REQUIRED_NUMBER_OF_VALIDATORS: ${requiredNumber}, VALIDATORS_OWNER: ${owner}`)
    logValidatorsAndRewardAccounts(validators, rewardAccounts)
    data = await contract.methods.initialize(requiredNumber, validators, rewardAccounts, owner).encodeABI()
  } else {
    console.log(
      `REQUIRED_NUMBER_OF_VALIDATORS: ${requiredNumber}, VALIDATORS: ${validators}, VALIDATORS_OWNER: ${owner}`
    )
    data = await contract.methods.initialize(requiredNumber, validators, owner).encodeABI()
  }
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: contract.options.address,
    from: getDeploymentAccountAddress(url),
    url
  })
  if (result.status) {
    assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
  } else {
    await assertStateWithRetry(contract.methods.isInitialized().call, true)
  }
}

async function assertStateWithRetry(fn, expected) {
  return promiseRetry(async retry => {
    const value = await fn()
    if (value !== expected && value.toString() !== expected) {
      retry(`Transaction Failed. Expected: ${expected} Actual: ${value}`)
    }
  })
}

function getSendTxMethod(url) {
  return url === HOME_RPC_URL ? sendRawTxHome : sendRawTxForeign
}

function getWeb3Provider(url) {
  return url === HOME_RPC_URL ? web3Home : web3Foreign
}

function getDeploymentAccountAddress(url) {
  return url === HOME_RPC_URL ? HOME_DEPLOYMENT_ACCOUNT_ADDRESS : FOREIGN_DEPLOYMENT_ACCOUNT_ADDRESS
}

async function isContract(web3, address) {
  const code = await web3.eth.getCode(address)
  return code !== '0x' && code !== '0x0'
}

module.exports = {
  deployContract,
  sendRawTxHome,
  sendRawTxForeign,
  logValidatorsAndRewardAccounts,
  upgradeProxy,
  initializeValidators,
  transferProxyOwnership,
  transferOwnership,
  setBridgeContract,
  assertStateWithRetry,
  isContract
}
