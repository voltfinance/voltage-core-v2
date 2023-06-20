// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

struct LaunchpadParams {
    address projectToken;
    address saleToken;
    uint256 projectTokenReserve;
    uint256 minSaleTokenReserve;
    uint256 maxSaleTokenReserve;
    uint256 veVoltPerProjectToken;
    uint256 stakedUserMaxBuyAmount;
    uint256 unstakedUserMaxBuyAmount;
    uint256 startTime;
    uint256 endTime;
    uint256 snapshotTime;
    uint256 claimStartTime;
    uint256 claimVestingDuration;
    address projectTreasury;
}

interface ILaunchpadFactory {
    function withdrawFee() external view returns (uint256);
    function launchFee() external view returns (uint256);
    function SCALE() external view returns (uint256);
    function veVolt() external view returns (address);
    function owner() external view returns (address);
}
