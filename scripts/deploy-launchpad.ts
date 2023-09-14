import { ethers } from 'hardhat'

const VEVOLT_ADDRESS = process.env.VEVOLT_ADDRESS

async function main() {
  if (!VEVOLT_ADDRESS) return

  const LaunchpadFactory = await ethers.getContractFactory('LaunchpadFactory')
  const factory = await LaunchpadFactory.deploy(VEVOLT_ADDRESS, 10, 10)

  console.log({
    launchpad: factory.address,
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
