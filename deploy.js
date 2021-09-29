const path = require("path");
const fs = require("fs-extra"); // fs with extra functions
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require('web3');

const compiledContractPath = './src/ethereum/build/who.json';
const compiledContract = require(compiledContractPath);

// Mnemonic from a test account and an Infura provider
const provider = new HDWalletProvider(
  'tragic square news business dad cricket nurse athlete tide split about ring',
  'https://rinkeby.infura.io/v3/b2daf36eb4d74aed8ffac330c09dd2ee'
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts);
  console.log('Attempting to deploy from account', accounts[0]);

  // We deploy the EDelivery smart contract to the Rinkeby test network

  const result = await new web3.eth.Contract(compiledContract.abi)
      .deploy({ data: '0x'+compiledContract.evm.bytecode.object, arguments: [] })
      .send({ from: accounts[0], gas: '8000000' });
  
  // fs.writeFileSync('./CONTRACTADDRESS', result.options.address);
  compiledContract.address = result.options.address;

  fs.outputJsonSync(
    path.resolve(__dirname, compiledContractPath),
    compiledContract,
    {spaces: 2} // Indent json output with 2 spaces
  );
  
  console.log('Contract deployed to Rinkeby network, at address ', result.options.address);
};

deploy();
