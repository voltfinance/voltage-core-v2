import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { RewardDistributor, TestERC20 } from '../../typechain-types'
import { formatEther } from 'ethers/lib/utils'

describe('RewardDistributor', () => {
  let rewardDistributor: RewardDistributor
  let owner: SignerWithAddress
  let distributor: SignerWithAddress
  let user: SignerWithAddress
  let token: TestERC20

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]
    distributor = signers[1]
    user = signers[2]

    const RewardDistributorFactory = await ethers.getContractFactory(
      'RewardDistributor',
    )
    rewardDistributor = await RewardDistributorFactory.deploy(
      owner.address,
      distributor.address,
    )

    const TestERC20Factory = await ethers.getContractFactory('TestERC20')
    token = await TestERC20Factory.deploy(
      'Volt Token',
      'VOLT',
      18,
      ethers.utils.parseEther('100000'),
    )

    await token.transfer(
      rewardDistributor.address,
      ethers.utils.parseEther('100000'),
    )
    await owner.sendTransaction({
      to: rewardDistributor.address,
      value: ethers.utils.parseEther('500'),
    })
  })

  describe('add reward', () => {
    it('owner should be able to add fuse reward', async () => {
      await expect(
        rewardDistributor.addReward(
          '50 Volt',
          'Welcome Reward',
          token.address,
          ethers.utils.parseEther('50'),
          false,
          true,
        ),
      ).not.reverted
    })

    it('owner should be able to add token reward', async () => {
      await expect(
        rewardDistributor.addReward(
          '50 Volt',
          'Welcome Reward',
          token.address,
          ethers.utils.parseEther('50'),
          false,
          false,
        ),
      ).not.reverted
    })
  })

  describe('add distribution', () => {
    it('distributor should be able to add variable distribution', async () => {
      await rewardDistributor.addReward(
        '50 Volt',
        'Welcome Reward',
        token.address,
        ethers.utils.parseEther('50'),
        true,
        false,
      )

      await expect(
        rewardDistributor
          .connect(distributor)
          .addDistribution(0, user.address, ethers.utils.parseEther('50')),
      ).not.reverted
    })
    it('distributor should be able to add fixed distribution', async () => {
      await rewardDistributor.addReward(
        '50 Volt',
        'Welcome Reward',
        token.address,
        ethers.utils.parseEther('50'),
        false,
        false,
      )

      await expect(
        rewardDistributor
          .connect(distributor)
          .addDistribution(0, user.address, ethers.utils.parseEther('50')),
      ).not.reverted
    })
    it('should fail if user already has distribution', async () => {
      await rewardDistributor.addReward(
        '50 Volt',
        'Welcome Reward',
        token.address,
        ethers.utils.parseEther('50'),
        false,
        false,
      )

      await expect(
        rewardDistributor
          .connect(distributor)
          .addDistribution(0, user.address, ethers.utils.parseEther('50')),
      ).be.not.reverted

      await expect(
        rewardDistributor
          .connect(distributor)
          .addDistribution(0, user.address, ethers.utils.parseEther('50')),
      ).be.reverted
    })
  })

  describe('claim distribution', () => {
    it('user should be able to claim token variable distribution', async () => {
      rewardDistributor.addReward(
        'Deposit Volt Reward',
        'Welcome Reward',
        token.address,
        ethers.utils.parseEther('50'),
        true,
        false,
      )

      await rewardDistributor
        .connect(distributor)
        .addDistribution(0, user.address, ethers.utils.parseEther('75'))

      await rewardDistributor.connect(user).claimDistribution(0)

      expect(await token.balanceOf(user.address)).to.equal(
        ethers.utils.parseEther('75'),
      )
    })
    it('user should be able to claim token fixed distribution', async () => {
      await rewardDistributor.addReward(
        '50 Volt',
        'Welcome Reward',
        token.address,
        ethers.utils.parseEther('50'),
        false,
        false,
      )

      await rewardDistributor
        .connect(distributor)
        .addDistribution(0, user.address, 0)

      await rewardDistributor.connect(user).claimDistribution(0)

      expect(await token.balanceOf(user.address)).to.equal(
        ethers.utils.parseEther('50'),
      )
    })
    it('user should be able to claim fuse variable distribution', async () => {
      rewardDistributor.addReward(
        'Deposit Volt Reward',
        'Welcome Reward',
        token.address,
        ethers.utils.parseEther('50'),
        true,
        true,
      )

      await rewardDistributor
        .connect(distributor)
        .addDistribution(0, user.address, ethers.utils.parseEther('75'))

      const balanceBefore = await user.getBalance()

      await rewardDistributor.connect(user).claimDistribution(0)

      expect(await user.getBalance()).to.within(
        balanceBefore.add(ethers.utils.parseEther('74.99')),
        balanceBefore.add(ethers.utils.parseEther('75')),
      )
    })

    it('user should be able to claim fuse fixed distribution', async () => {
      rewardDistributor.addReward(
        'Deposit Volt Reward',
        'Welcome Reward',
        token.address,
        ethers.utils.parseEther('50'),
        false,
        true,
      )

      await rewardDistributor
        .connect(distributor)
        .addDistribution(0, user.address, ethers.utils.parseEther('50'))

      const balanceBefore = await user.getBalance()

      await rewardDistributor.connect(user).claimDistribution(0)

      expect(await user.getBalance()).to.within(
        balanceBefore.add(ethers.utils.parseEther('49.99')),
        balanceBefore.add(ethers.utils.parseEther('50')),
      )
    })
  })

  it('should withdraw all fuse', async () => {
    expect(
      await ethers.provider.getBalance(rewardDistributor.address),
    ).to.equal('500000000000000000000')

    await rewardDistributor.withdrawFUSE()

    expect(
      await ethers.provider.getBalance(rewardDistributor.address),
    ).to.equal('0')
  })
})
