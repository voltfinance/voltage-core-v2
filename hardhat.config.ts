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
        version: "0.8.0",
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
  },
  networks: {
    hardhat: {},
    // spark: {
    //   url: 'https://rpc.fusespark.io',
    //   accounts: [`0x${process.env.PRIVATE_KEY}`]
    // },
    // fuse: {
    //   url: 'https://rpc.fuse.io',
    //   accounts: [`0x${process.env.PRIVATE_KEY}`]
    // }
  }
};

export default config;
