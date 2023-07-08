// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RewardDistributor is Ownable, ReentrancyGuard {
    struct Reward {
        uint256 rewardId;
        address rewardToken;
        uint256 rewardAmount;
        bool isActive;
    }

    struct Distribution {
        address user;
        uint256 rewardId;
        uint256 rewardAmount;
        bool isClaimed;
        bool isActive;
    }

    uint256 public totalRewardCount;

    mapping(uint256 => Reward) public rewards;

    mapping(uint256 => mapping(address => Distribution))
        public userDistribution;

    mapping(address => Distribution[]) public userDistributions;

    function addReward(
        address _rewardToken,
        uint256 _rewardAmount
    ) public onlyOwner {
        Reward memory _reward = Reward({
            rewardId: totalRewardCount,
            rewardToken: _rewardToken,
            rewardAmount: _rewardAmount,
            isActive: true
        });

        rewards[totalRewardCount] = _reward;

        totalRewardCount++;
    }

    function addDistribution(
        uint256 _rewardId,
        address _user
    ) public onlyOwner {
        Reward memory reward = rewards[_rewardId];

        require(!reward.isActive, "addDistribution: reward not found");
        require(
            !userDistribution[_rewardId][_user].isActive,
            "addDistribution: distribution already added"
        );

        Distribution memory distribution = Distribution({
            user: _user,
            rewardId: _rewardId,
            rewardAmount: reward.rewardAmount,
            isClaimed: false,
            isActive: true
        });

        userDistribution[_rewardId][_user] = distribution;
        userDistributions[_user].push(distribution);
    }

    function claimDistribution(uint256 _rewardId) public nonReentrant {
        Distribution storage distribution = userDistribution[_rewardId][
            msg.sender
        ];

        require(
            distribution.isActive,
            "claimDistribution: user has no distribution"
        );

        require(
            !distribution.isClaimed,
            "claimDistribution: reward already claimed"
        );

        Reward memory reward = rewards[_rewardId];

        distribution.isClaimed = true;

        IERC20(reward.rewardToken).transfer(msg.sender, reward.rewardAmount);
    }

    function withdrawRewardToken(address _rewardToken) public onlyOwner {
        IERC20(_rewardToken).transfer(
            owner(),
            IERC20(_rewardToken).balanceOf(address(this))
        );
    }
}
