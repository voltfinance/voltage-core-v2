import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-truffle5'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-web3'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-vyper'
import 'hardhat-contract-sizer'
import 'solidity-coverage'
import '@typechain/hardhat'
import dotenv from 'dotenv'

dotenv.config()

const accounts = process.env.PRIVATE_KEY
  ? { accounts: [`0x${process.env.PRIVATE_KEY}`] }
  : {}

const config = {
  solidity: {
    compilers: [
      {
        version: '0.8.1',
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
    compilers: [{ version: '0.2.7' }, { version: '0.3.1' }],
  },
  networks: {
    hardhat: {},
    spark: {
      url: 'https://rpc.fusespark.io',
      ...accounts,
    },
    fuse: {
      url: 'https://rpc.fuse.io',
      ...accounts,
    },
  },
}

export default config
