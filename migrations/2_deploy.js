const UMCToken = artifacts.require('UMCToken');
const UMCRecipient = artifacts.require('UMCRecipient');
const EBTCToken = artifacts.require('EBTC');
const ChequeOperator = artifacts.require('ChequeOperator');
const SwapContract = artifacts.require('SwapContract');
const BatchSend = artifacts.require('BatchSend');

// const PIXCToken = artifacts.require('PIXCToken');

require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });

const { singletons } = require('@openzeppelin/test-helpers');

module.exports = async function (deployer, network, accounts) {
  // await deployer.deploy(PIXCToken);
  
  if (network === 'development') {
    // In a test environment an ERC777 token requires deploying an ERC1820 registry
    await singletons.ERC1820Registry(accounts[0]);
    await deployer.deploy(EBTCToken);
  }
  if (network === 'ganache') {
    // In a test environment an ERC777 token requires deploying an ERC1820 registry
    await singletons.ERC1820Registry(accounts[0]);
    await deployer.deploy(EBTCToken);
  }
  if (network === 'kovan') {
    // In a test environment an ERC777 token requires deploying an ERC1820 registry
    await singletons.ERC1820Registry(accounts[0]);
    await deployer.deploy(EBTCToken);
  }

  await deployer.deploy(SwapContract);
  await deployer.deploy(ChequeOperator);
  

  const swapContract = await SwapContract.deployed();
  const chequeContract = await ChequeOperator.deployed();
  await deployer.deploy(UMCToken, swapContract.address, chequeContract.address);
  const token = await UMCToken.deployed();
  await deployer.deploy(UMCRecipient, token.address);
  var oldToken_addr;
  if(network === 'mainnet'){
    oldToken_addr = "0x91b78307d7fc6c7293b8bd868aa0eb0c9c01bf16";
  }
  else{
    var oldToken = await EBTCToken.deployed();
    oldToken_addr = oldToken.address;
  }

  await swapContract.setTokenAddress(oldToken_addr,token.address);
  await deployer.deploy(BatchSend);

};
