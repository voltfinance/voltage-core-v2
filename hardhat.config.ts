import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-vyper";
import "hardhat-contract-sizer";

const config = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            runs: 9999,
            enabled: true,
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            runs: 9999,
            enabled: true,
          },
        },
      },
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            runs: 9999,
            enabled: true,
          },
        },
      },
    ],
  },
  vyper: {
    compilers: [{ version: "0.2.7" }, { version: "0.3.1" }],
  }
};

export default config;
