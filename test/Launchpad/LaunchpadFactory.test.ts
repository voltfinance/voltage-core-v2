import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  LaunchpadFactory,
  LaunchpadFactory__factory,
} from '../../typechain-types'
import { getTimestamp } from '../utils/time'
import { LaunchpadParamsStruct } from '../../typechain-types/contracts/launchpad/Launchpad'

describe('LaunchpadFactory', () => {
  let veVolt: any
  let volt: any
  let owner: any
  let alice: any
  let bob: any
  let projectTreasury: any
  let LaunchpadFactory: LaunchpadFactory__factory

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]
    alice = signers[1]
    bob = signers[2]
    projectTreasury = signers[3]

    volt = await ethers.deployContract('TestERC20', [
      'Voltage',
      'Volt',
      18,
      ethers.utils.parseEther('100'),
    ])

    veVolt = await ethers.deployContract('VotingEscrow', [
      volt.address,
      'Vote-escrow Volt',
      'VeVolt',
      owner.address,
    ])

    LaunchpadFactory = await ethers.getContractFactory('LaunchpadFactory')
  })

  describe('deployment', () => {
    it('should deploy with correct params', async () => {
      await expect(LaunchpadFactory.deploy(veVolt.address, '25', '25')).not.be
        .reverted
    })

    it('should fail to deploy when withdraw is invalid', async () => {
      await expect(LaunchpadFactory.deploy(veVolt.address, '50', '25')).be
        .reverted

      await expect(LaunchpadFactory.deploy(veVolt.address, '0', '25')).be
        .reverted
    })

    it('should fail to deploy when launchpadFee is invalid', async () => {
      await expect(LaunchpadFactory.deploy(veVolt.address, '25', '0')).be
        .reverted

      await expect(LaunchpadFactory.deploy(veVolt.address, '0', '50')).be
        .reverted
    })
  })

  describe('setters', () => {
    let factory: LaunchpadFactory

    beforeEach(async () => {
      factory = await LaunchpadFactory.deploy(veVolt.address, '25', '25')
    })

    describe('launchpadFee', () => {
      it('should set launchpad fee when owner with valid value', async () => {
        expect(await factory.launchpadFee()).to.equal('25')

        await expect(factory.setLaunchpadFee('0')).to.be.reverted

        await expect(factory.setLaunchpadFee('50')).to.be.reverted

        await factory.setLaunchpadFee('10')

        expect(await factory.launchpadFee()).to.equal('10')
      })

      it('should fail to set launchpad fee if not owner', async () => {
        await expect(factory.connect(bob).setLaunchpadFee('10')).be.reverted
      })
    })

    describe('withdrawFee', () => {
      it('should set withdraw fee when owner with valid value', async () => {
        expect(await factory.withdrawFee()).to.equal('25')

        await expect(factory.setWithdrawFee('0')).to.be.reverted

        await expect(factory.setWithdrawFee('50')).to.be.reverted

        await factory.setWithdrawFee('10')

        expect(await factory.withdrawFee()).to.equal('10')
      })

      it('should fail to set withdraw fee if not owner', async () => {
        await expect(factory.connect(bob).setWithdrawFee('10')).be.reverted
      })
    })
  })

  describe('create launchpad', () => {
    let factory: LaunchpadFactory
    let projectToken: any
    let usdcToken: any
    let launchpadParams: LaunchpadParamsStruct

    beforeEach(async () => {
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
        ethers.utils.parseEther('100000000'),
      )

      await projectToken.approve(
        factory.address,
        ethers.utils.parseEther('100000000'),
      )

      const timeNow = await getTimestamp()

      launchpadParams = {
        projectToken: projectToken.address,
        saleToken: usdcToken.address,
        projectTokenReserve: ethers.utils.parseEther('10000000'),
        minSaleTokenReserve: ethers.utils.parseUnits('500000', 6),
        maxSaleTokenReserve: ethers.utils.parseUnits('1000000', 6),
        veVoltPerProjectToken: '5',
        stakedUserMaxBuyAmount: ethers.utils.parseUnits('5000', 6),
        unstakedUserMaxBuyAmount: ethers.utils.parseUnits('200', 6),
        startTime: timeNow.add('25'),
        endTime: timeNow.add('100'),
        snapshotTime: timeNow.add('5'),
        claimVestingDuration: 0,
        projectTreasury: projectTreasury.address,
      }
    })

    it('should create launchpad with no vesting', async () => {
      await expect(factory.createLaunchpad(launchpadParams)).not.be.reverted
    })

    it('should create launchpad with vesting', async () => {
      await expect(
        factory.createLaunchpad({
          ...launchpadParams,
          claimVestingDuration: 5,
        }),
      ).not.be.reverted
    })

    it('should fail if launch already created for token', async () => {
      const timeNow = await getTimestamp()

      await factory.createLaunchpad(launchpadParams)

      await expect(factory.createLaunchpad(launchpadParams)).be.reverted
    })
  })
})
