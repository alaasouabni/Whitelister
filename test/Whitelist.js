


// contract under test
const Whitelist = artifacts.require('./Whitelist.sol')

describe('when deployed', () => {
  contract('Whitelist', accounts => {
    const [ownerAddress, addressToWhitelist, anyAddress] = accounts

    let whitelistContract
    before('setup contract', async () => {
      whitelistContract = await Whitelist.new({ from: ownerAddress })
    })

    describe('initial state', () => {
      it('should start with owner set as contract creator', async () => {
        assert.equal(
          await whitelistContract.owner(),
          ownerAddress,
          'should be the contract creator'
        )

        assert.equal(
          await whitelistContract.owner({ from: anyAddress }),
          ownerAddress,
          'should be public state'
        )
      })
    })

      describe('when ownerAddress is sending transactions', () => {
        it('should add an address', async () => {
          await addAddress({
            addressToWhitelist,
            ownerAddress,
            whitelistContract,
          })
        })

        it('should not add an already whitelisted address', async () => {
          assert.equal(
            await whitelistContract.whitelisted(addressToWhitelist),
            true,
            'address should be whitelisted'
          )

          await testWillThrow(whitelistContract.addAddress, [
            addressToWhitelist,
            { from: ownerAddress },
          ])
        })

        it('should allow anyone to see whitelisted status of an address', async () => {
          assert.equal(
            await whitelistContract.whitelisted(addressToWhitelist, {
              from: anyAddress,
            }),
            true,
            'should be public state'
          )
        })

        it('should remove an address', async () => {
          await removeAddress({
            addressToWhitelist,
            ownerAddress,
            whitelistContract,
          })
        })

        it('should not remove an already non-whitelisted address', async () => {
          await testWillThrow(whitelistContract.removeAddress, [
            addressToWhitelist,
            { from: ownerAddress },
          ])
        })

        it('should allow anyone to see non-whitelisted status of an address', async () => {
          assert.equal(
            await whitelistContract.whitelisted(addressToWhitelist, {
              from: anyAddress,
            }),
            false,
            'should be public state'
          )
        })
      })

      describe('when a non-owner address is sending transactions', () => {
        it('should fail to add an address', async () => {
          await testWillThrow(whitelistContract.addAddress, [
            addressToWhitelist,
            { from: anyAddress },
          ])
        })

        it('should fail to remove an address', async () => {
          await testWillThrow(whitelistContract.removeAddress, [
            addressToWhitelist,
            { from: anyAddress },
          ])
        })
      })
    })

  })

  const addAddress = async ({
    addressToWhitelist,
    ownerAddress,
    whitelistContract,
  }) => {
    assert.equal(
      await whitelistContract.whitelisted(addressToWhitelist),
      false,
      'should start false'
    )
  
    await whitelistContract.addAddress(addressToWhitelist, {
      from: ownerAddress,
    })
  
    assert.equal(
      await whitelistContract.whitelisted(addressToWhitelist),
      true,
      'should be changed to true'
    )
  }
  
  const removeAddress = async ({
    addressToWhitelist,
    ownerAddress,
    whitelistContract,
  }) => {
    assert.equal(
      await whitelistContract.whitelisted(addressToWhitelist),
      true,
      'should start true'
    )
  
    await whitelistContract.removeAddress(addressToWhitelist, {
      from: ownerAddress,
    })
  
    assert.equal(
      await whitelistContract.whitelisted(addressToWhitelist),
      false,
      'should be changed to false'
    )
  }
  
  const testWillThrow = async (fn, args) => {
    try {
      const txHash = await fn.apply(null, args)
  
      if (web3.version.network === 80001) {
        // if network is devGeth
        await waitForReceiptStatusSuccessOrThrow(txHash)
      }
  
      assert(false, 'the contract should throw here')
    } catch (error) {
      assert(
        /invalid opcode/.test(error.message || error) ||
        /invalid argument/.test(error.message || error) ||
          /revert/.test(error.message || error),
        `the error message should be "invalid opcode", "invalid argument" or "revert", the error was ${error}`
      )
    }
  }