import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  LaunchpadFactory,
  LaunchpadFactory__factory,
  Launchpad,
} from '../../typechain-types'
import { getTimestamp, increaseTime } from '../utils/time'
import { LaunchpadParamsStruct } from '../../typechain-types/contracts/launchpad/Launchpad'

const parseUnits6 = (amount: string) => {
  return ethers.utils.parseUnits(amount, 6)
}

const parseUnits18 = (amount: string) => {
  return ethers.utils.parseEther(amount)
}

describe('Launchpad', () => {
  let veVolt: any
  let volt: any
  let owner: any
  let alice: any
  let bob: any
  let charlie: any
  let projectTreasury: any
  let LaunchpadFactory: LaunchpadFactory__factory
  let factory: LaunchpadFactory
  let projectToken: any
  let usdcToken: any
  let launchpadParams: LaunchpadParamsStruct

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]
    alice = signers[1]
    bob = signers[2]
    charlie = signers[3]
    projectTreasury = signers[4]

    volt = await ethers.deployContract('TestERC20', [
      'Voltage',
      'Volt',
      18,
      ethers.utils.parseEther('100000000'),
    ])

    await volt.transfer(bob.address, ethers.utils.parseEther('1000000'))
    await volt.transfer(alice.address, ethers.utils.parseEther('1000000'))

    veVolt = await ethers.deployContract('VotingEscrow', [
      volt.address,
      'Vote-escrow Volt',
      'VeVolt',
      owner.address,
    ])

    await volt
      .connect(bob)
      .approve(veVolt.address, ethers.utils.parseEther('1000000'))
    await volt
      .connect(alice)
      .approve(veVolt.address, ethers.utils.parseEther('1000000'))

    const timeNow = await getTimestamp()

    await veVolt
      .connect(bob)
      .create_lock(
        ethers.utils.parseEther('1000000'),
        timeNow.add((86400 * 365).toString()),
      )
    await veVolt
      .connect(alice)
      .create_lock(
        ethers.utils.parseEther('1000000'),
        timeNow.add((86400 * 7 * 4).toString()),
      )

    LaunchpadFactory = await ethers.getContractFactory('LaunchpadFactory')

    factory = await LaunchpadFactory.deploy(veVolt.address, '25', '25')

    const TestERC20 = await ethers.getContractFactory('TestERC20')

    projectToken = await TestERC20.deploy(
      'Project',
      'PT',
      18,
      ethers.utils.parseEther('100000000'),
    )

    usdcToken = await TestERC20.deploy(
      'USD Coin',
      'USDC',
      6,
      parseUnits6('30000'),
    )

    await projectToken.approve(
      factory.address,
      ethers.utils.parseEther('100000000'),
    )

    await usdcToken.transfer(bob.address, ethers.utils.parseUnits('10000', 6))
    await usdcToken.transfer(alice.address, ethers.utils.parseUnits('10000', 6))
    await usdcToken.transfer(
      charlie.address,
      ethers.utils.parseUnits('10000', 6),
    )

    launchpadParams = {
      projectToken: projectToken.address,
      saleToken: usdcToken.address,
      projectTokenReserve: ethers.utils.parseEther('10000000'),
      minSaleTokenReserve: parseUnits6('8000'),
      maxSaleTokenReserve: parseUnits6('15000'),
      veVoltPerProjectToken: ethers.utils.parseEther('4.5'),
      stakedUserMaxBuyAmount: parseUnits6('10000'),
      unstakedUserMaxBuyAmount: parseUnits6('200'),
      startTime: timeNow.add('25'),
      endTime: timeNow.add('100'),
      snapshotTime: timeNow.add('10'),
      vestingDays: 0,
      projectTreasury: projectTreasury.address,
    }
  })

  describe('constructor', () => {
    it('should fail if project token is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          projectToken: ethers.constants.AddressZero,
        }),
      ).to.be.reverted
    })

    it('should fail if sale token is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          saleToken: ethers.constants.AddressZero,
        }),
      ).to.be.reverted
    })

    it('should fail if project token reserve is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          projectTokenReserve: '0',
        }),
      ).to.be.reverted
    })

    it('should fail if min sale token reserve is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          minSaleTokenReserve: '0',
        }),
      ).to.be.reverted
    })

    it('should fail if max sale token reserve is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          maxSaleTokenReserve: '0',
        }),
      ).to.be.reverted
    })

    it('should fail if project treasury address is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          projectTreasury: ethers.constants.AddressZero,
        }),
      ).to.be.reverted
    })

    it('should fail if vevoltPerProjectToken address is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          veVoltPerProjectToken: '0',
        }),
      ).to.be.reverted
    })

    it('should fail if staked user max buy amount is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          stakedUserMaxBuyAmount: '0',
        }),
      ).to.be.reverted
    })

    it('should fail if unstaked user max buy amount is zero', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          unstakedUserMaxBuyAmount: '0',
        }),
      ).to.be.reverted
    })

    it('should fail if claim vesting duration is more than 90days', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          vestingDays: 90,
        }),
      ).to.be.reverted
    })

    it('should fail if end time is greater than startTime', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          endTime: launchpadParams.startTime,
        }),
      ).to.be.reverted
    })
  })

  describe('non vested', () => {
    let launchpad: Launchpad

    beforeEach(async () => {
      await factory.createLaunchpad(launchpadParams)

      const launchpadAddress = await factory.launchpads(projectToken.address)

      launchpad = await ethers.getContractAt('Launchpad', launchpadAddress)

      await usdcToken
        .connect(bob)
        .approve(launchpadAddress, parseUnits6('20000'))
      await usdcToken
        .connect(alice)
        .approve(launchpadAddress, parseUnits6('20000'))
      await usdcToken
        .connect(charlie)
        .approve(launchpadAddress, parseUnits6('20000'))
    })

    it('should fail if sale not active', async () => {
      await expect(
        launchpad.connect(bob).buy(ethers.utils.parseUnits('15000', 6)),
      ).be.revertedWith('saleActive: launch event is not active')
    })

    it('should fail to buy if buy amount 0', async () => {
      await increaseTime(26)

      await expect(
        launchpad.connect(bob).buy(parseUnits6('0')),
      ).be.revertedWith('buy: amount > 0')
    })

    it('should fail to buy if hardcap reached', async () => {
      await increaseTime(26)

      await launchpad.connect(bob).buy(parseUnits6('10000'))

      expect(launchpad.connect(alice).buy(parseUnits6('7000'))).be.revertedWith(
        'buy: hardcap reached',
      )
    })

    it('participants should not be able to buy more than allocation', async () => {
      await increaseTime(26)

      await expect(
        launchpad.connect(bob).buy(parseUnits6('10001')),
      ).be.revertedWith('buy: user hardcap reached')

      await expect(
        launchpad.connect(alice).buy(parseUnits6('8000')),
      ).be.revertedWith('buy: user hardcap reached')

      await expect(
        launchpad.connect(charlie).buy(parseUnits6('201')),
      ).be.revertedWith('buy: user hardcap reached')
    })

    it('participants should be able to buy and claim tokens instantly', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      await expect(launchpad.connect(bob).claim()).be.revertedWith(
        "saleEnded: launch event hasn't ended",
      )

      await increaseTime(76)

      // claim
      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        '6666666666666666666666666',
      )

      await launchpad.connect(alice).claim()

      expect(await projectToken.balanceOf(alice.address)).to.equal(
        '3200000000000000000000000',
      )

      await launchpad.connect(charlie).claim()

      expect(await projectToken.balanceOf(charlie.address)).to.equal(
        '133333333333333333333333',
      )
    })

    it('project owner should receive sale tokens on sale end', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      await increaseTime(76)

      // claim sale tokens
      await launchpad.withdrawSaleTokens()

      expect(await usdcToken.balanceOf(projectTreasury.address)).to.equal(
        parseUnits6('14625'),
      )
    })

    it('launcpad owner should receive fees on sale end', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      await increaseTime(76)

      // claim sale tokens
      await launchpad.withdrawSaleTokens()

      expect(await usdcToken.balanceOf(owner.address)).to.equal(
        parseUnits6('375'),
      )
    })

    it('when sale is 50% done should only distribute 50% of the tokens', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('4000'))

      await increaseTime(76)

      // withdraw unsold tokens
      await launchpad.withdrawUnsoldProjectTokens()

      expect(await projectToken.balanceOf(projectTreasury.address)).to.equal(
        parseUnits18('5000000'),
      )

      // claim project tokens
      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        parseUnits18('5000000'),
      )

      // claim sale tokens
      await launchpad.withdrawSaleTokens()

      expect(await usdcToken.balanceOf(projectTreasury.address)).to.equal(
        parseUnits6('3900'),
      )
    })

    it('particpants can withdraw funds after buy before sale end', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('4000'))

      await increaseTime(4)

      // withdraw
      await launchpad.connect(bob).withdraw(parseUnits6('2000'))

      expect(await usdcToken.balanceOf(bob.address)).to.equal(
        parseUnits6('7950'),
      )

      expect(await usdcToken.balanceOf(owner.address)).to.equal(
        parseUnits6('50'),
      )
    })

    it('should fail to withdraw sale tokens if sale hasnt ended', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      // claim sale tokens
      await expect(launchpad.withdrawSaleTokens()).be.revertedWith(
        "saleEnded: launch event hasn't ended",
      )
    })

    it('should fail to withdraw sale tokens if sale hasnt ended', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      // claim sale tokens
      await expect(launchpad.withdrawUnsoldProjectTokens()).be.revertedWith(
        "saleEnded: launch event hasn't ended",
      )
    })

    it('should fail to withdraw if sale has ended', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))

      await increaseTime(76)

      await expect(launchpad.connect(bob).withdraw('5000')).be.revertedWith(
        'saleActive: launch event is not active',
      )
    })

    it('should fail to withdraw if amount more than balance', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))

      await expect(
        launchpad.connect(bob).withdraw(parseUnits6('11000')),
      ).be.revertedWith('withdraw: amount greater than balance')
    })

    it('should fail to claim if user has not claimable amount', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))

      const claim = await launchpad.calculateUserClaim(bob.address)
      expect(claim[0].toString()).to.equal('0')
      expect(claim[1].toString()).to.equal('0')

      await increaseTime(76)

      await expect(launchpad.connect(alice).claim()).be.revertedWith(
        'claim: amount vested > 0',
      )
    })
  })

  describe('vested', () => {
    let launchpad: Launchpad

    beforeEach(async () => {
      await factory.createLaunchpad({
        ...launchpadParams,
        vestingDays: 5,
      })

      const launchpadAddress = await factory.launchpads(projectToken.address)

      launchpad = await ethers.getContractAt('Launchpad', launchpadAddress)

      await usdcToken
        .connect(bob)
        .approve(launchpadAddress, parseUnits6('20000'))
      await usdcToken
        .connect(alice)
        .approve(launchpadAddress, parseUnits6('20000'))
      await usdcToken
        .connect(charlie)
        .approve(launchpadAddress, parseUnits6('20000'))
    })

    it('participants should be able to buy and claim tokens linearly', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('7569'))

      await increaseTime(76)

      await increaseTime(86400)

      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        '1892250000000000000000000',
      )

      await increaseTime(86400)

      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        '3784500000000000000000000',
      )

      await increaseTime(86400)

      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        '5676750000000000000000000',
      )

      await increaseTime(86400)

      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        '7569000000000000000000000',
      )

      await increaseTime(86400 * 5)

      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        '9461250000000000000000000',
      )
    })

    it('should fail if sale not active', async () => {
      await expect(
        launchpad.connect(bob).buy(ethers.utils.parseUnits('15000', 6)),
      ).be.revertedWith('saleActive: launch event is not active')
    })

    it('should fail to buy if buy amount 0', async () => {
      await increaseTime(26)

      await expect(
        launchpad.connect(bob).buy(parseUnits6('0')),
      ).be.revertedWith('buy: amount > 0')
    })

    it('should fail to buy if hardcap reached', async () => {
      await increaseTime(26)

      await launchpad.connect(bob).buy(parseUnits6('10000'))

      expect(launchpad.connect(alice).buy(parseUnits6('7000'))).be.revertedWith(
        'buy: hardcap reached',
      )
    })

    it('participants should not be able to buy more than allocation', async () => {
      await increaseTime(26)

      await expect(
        launchpad.connect(bob).buy(parseUnits6('10001')),
      ).be.revertedWith('buy: user hardcap reached')

      await expect(
        launchpad.connect(alice).buy(parseUnits6('8000')),
      ).be.revertedWith('buy: user hardcap reached')

      await expect(
        launchpad.connect(charlie).buy(parseUnits6('201')),
      ).be.revertedWith('buy: user hardcap reached')
    })

    it('project owner should receive sale tokens on sale end', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      await increaseTime(76)

      // claim sale tokens
      await launchpad.withdrawSaleTokens()

      expect(await usdcToken.balanceOf(projectTreasury.address)).to.equal(
        parseUnits6('14625'),
      )
    })

    it('launcpad owner should receive fees on sale end', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      await increaseTime(76)

      // claim sale tokens
      await launchpad.withdrawSaleTokens()

      expect(await usdcToken.balanceOf(owner.address)).to.equal(
        parseUnits6('375'),
      )
    })

    it('when sale is 50% done should only distribute 50% of the tokens', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('4000'))

      await increaseTime(76)

      // withdraw unsold tokens
      await launchpad.withdrawUnsoldProjectTokens()

      expect(await projectToken.balanceOf(projectTreasury.address)).to.equal(
        parseUnits18('5000000'),
      )

      await increaseTime(86400 * 5)

      // claim project tokens
      await launchpad.connect(bob).claim()

      expect(await projectToken.balanceOf(bob.address)).to.equal(
        parseUnits18('5000000'),
      )

      // claim sale tokens
      await launchpad.withdrawSaleTokens()

      expect(await usdcToken.balanceOf(projectTreasury.address)).to.equal(
        parseUnits6('3900'),
      )
    })

    it('particpants can withdraw funds after buy before sale end', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('4000'))

      await increaseTime(4)

      // withdraw
      await launchpad.connect(bob).withdraw(parseUnits6('2000'))

      expect(await usdcToken.balanceOf(bob.address)).to.equal(
        parseUnits6('7950'),
      )

      expect(await usdcToken.balanceOf(owner.address)).to.equal(
        parseUnits6('50'),
      )
    })

    it('should fail to withdraw sale tokens if sale hasnt ended', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      // claim sale tokens
      await expect(launchpad.withdrawSaleTokens()).be.revertedWith(
        "saleEnded: launch event hasn't ended",
      )
    })

    it('should fail to withdraw sale tokens if sale hasnt ended', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))
      await launchpad.connect(charlie).buy(parseUnits6('200'))

      // claim sale tokens
      await expect(launchpad.withdrawUnsoldProjectTokens()).be.revertedWith(
        "saleEnded: launch event hasn't ended",
      )
    })

    it('should fail to withdraw if sale has ended', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))

      await increaseTime(76)

      await expect(launchpad.connect(bob).withdraw('5000')).be.revertedWith(
        'saleActive: launch event is not active',
      )
    })

    it('should fail to withdraw if amount more than balance', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))
      await launchpad.connect(alice).buy(parseUnits6('4800'))

      await expect(
        launchpad.connect(bob).withdraw(parseUnits6('11000')),
      ).be.revertedWith('withdraw: amount greater than balance')
    })

    it('should fail to claim if user has not claimable amount', async () => {
      await increaseTime(26)

      // buy
      await launchpad.connect(bob).buy(parseUnits6('10000'))

      const claim = await launchpad.calculateUserClaim(bob.address)
      expect(claim[0].toString()).to.equal('0')
      expect(claim[1].toString()).to.equal('0')

      await increaseTime(76)

      await expect(launchpad.connect(alice).claim()).be.revertedWith(
        'claim: amount vested > 0',
      )
    })
  })
})
