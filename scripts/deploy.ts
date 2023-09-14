import { ethers } from "hardhat";

async function main() {
  const VOLT_ADDRESS = process.env.VOLT_ADDRESS
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS

  const VotingEscrow = await ethers.getContractFactory("VotingEscrow")
  const votingEscrow = await VotingEscrow.deploy(
    VOLT_ADDRESS,
    'Vote-escrowed VOLT',
    'veVolt',
    ADMIN_ADDRESS
  )

  await votingEscrow.deployed()

  console.log(
    `\nVolt voting lockup contract is deployed at ${votingEscrow.address}`
  ) 

  const startTime = 1688126400

  const PenaltyDistributor = await ethers.getContractFactory("PenaltyDistributor");
  const penaltyDistributor = await PenaltyDistributor.deploy(
    votingEscrow.address,
    startTime,
    VOLT_ADDRESS,
    ADMIN_ADDRESS,
    ADMIN_ADDRESS
  );

  await penaltyDistributor.deployed();

  console.log(
    `\nPenalty distributor contract is deployed at ${penaltyDistributor.address}`
  )

  await votingEscrow.set_reward_pool(penaltyDistributor.address)

  await penaltyDistributor.checkpoint_total_supply()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
