// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Launchpad.sol";

contract LuanchpadFactory is Ownable {
    uint256 constant SCALE = 1000;

    /// @dev The voltage vote-escrow token.
    address public immutable veVolt;

    /// @dev The withdraw fee.
    uint256 public withdrawFee;

    /// @dev The launchpad fee.
    uint256 public launchpadFee;

    /// @dev Launchpad addresses by project token.
    mapping(address => address) public launchpads;

    event LaunchCreated(
        address indexed projectToken,
        address indexed saleToken,
        uint256 minSaleTokenReserve
    );

    constructor(address _veVolt, uint256 _withdrawFee, uint256 _launchpadFee) {
        veVolt = _veVolt;
        withdrawFee = _withdrawFee;
        launchpadFee = _launchpadFee;
    }

    /// @dev Set the launchpad fee
    function setLaunchpadFee(uint256 _newFee) public onlyOwner {
        launchpadFee = _newFee;
    }

    /// @dev Set the withdraw fee
    function setWithdrawFee(uint256 _newFee) public onlyOwner {
        withdrawFee = _newFee;
    }

    /// @dev Create a new launchpad
    function createLaunchpad(LaunchpadParams memory _params) public onlyOwner {
        require(
            launchpads[_params.projectToken] == address(0),
            "createLaunchpad: token already launched"
        );

        address launch = address(new Launchpad(_params));

        IERC20(_params.projectToken).transferFrom(
            msg.sender,
            launch,
            _params.projectTokenReserve
        );

        launchpads[_params.projectToken] = launch;
    }
}
