const AddressChecker = artifacts.require('AddressChecker.sol')
const { expect } = require('chai')
const { ZERO_ADDRESS } = require('../setup')

contract('AddressUtils', () => {
  describe('isContract', () => {
    it('should check if an address is a contract', async () => {
      const addressChecker = await AddressChecker.new()

      expect(await addressChecker.isContract(addressChecker.address)).to.equal(true)
      expect(await addressChecker.isContract(ZERO_ADDRESS)).to.equal(false)
    })
  })
})
