import { ethers } from 'hardhat'
import dotenv from 'dotenv'

dotenv.config()

const SECONDS_IN_DAY = 86400
const LAUNCHPAD_FACTORY_ADDRESS = process.env.LAUNCHPAD_FACTORY_ADDRESS
const SALE_TOKEN_ADDRESS = process.env.SALE_TOKEN_ADDRESS

async function main() {
  const signers = await ethers.getSigners()

  const projectToken = await ethers.deployContract('TestERC20', [
    'TEST ERC20',
    'TERC20',
    '18',
    ethers.utils.parseEther('10000000'),
  ])

  console.log(`project token address: ${projectToken.address}`)

  const factory = await ethers.getContractAt(
    'LaunchpadFactory',
    LAUNCHPAD_FACTORY_ADDRESS ?? '',
  )

  const approveTxn = await projectToken.approve(
    factory.address,
    ethers.utils.parseEther('10000000'),
  )

  await approveTxn.wait(1)

  const now = Math.floor(new Date().getTime() / 1000)

  const createTxn = await factory.createLaunchpad({
    projectToken: projectToken.address,
    saleToken: SALE_TOKEN_ADDRESS ?? '',
    projectTokenReserve: ethers.utils.parseEther('10000000'),
    minSaleTokenReserve: ethers.utils.parseUnits('500000', 6),
    maxSaleTokenReserve: ethers.utils.parseUnits('1000000', 6),
    veVoltPerProjectToken: '5',
    stakedUserMaxBuyAmount: ethers.utils.parseUnits('5000', 6),
    unstakedUserMaxBuyAmount: ethers.utils.parseUnits('200', 6),
    startTime: now + SECONDS_IN_DAY,
    endTime: now + SECONDS_IN_DAY * 2,
    snapshotTime: now + SECONDS_IN_DAY / 2,
    vestingDays: 0,
    projectTreasury: signers[0].address,
  })

  createTxn.wait(2)

  console.log(await factory.launchpads(projectToken.address))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
