const path = require('path');
const fs = require('fs-extra'); // fs with extra functions
const solc = require('solc');

const CONTRACT_FILE_NAME = 'pasport_sc.sol';
const buildPath = path.resolve(__dirname, 'src/ethereum/build');
const contractPath = path.resolve(__dirname, 'contracts', CONTRACT_FILE_NAME);
const contractSource = fs.readFileSync(contractPath, 'utf8');

let input = {
  language: 'Solidity',
  sources: {
    'pasport_sc.sol' : {
          content: contractSource
      }
  },
  settings: {
      outputSelection: {
          '*': {
              '*': [ '*' ]
          }
      }
  }
}; 

// Remove the build folder and its content
fs.removeSync(buildPath);

// solc.compile generates a JSON output
console.log('Compiling '+contractPath+'...');
try {
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Ensure that build path exists
  fs.ensureDirSync(buildPath);

  // For each compiled smart contract, save it to build folder
  for (let contract in output.contracts[CONTRACT_FILE_NAME]) {
    console.log('Exporting '+contract+' contract...');
    
    // Save generated compiled output to json file
    fs.outputJsonSync(
      path.resolve(buildPath, contract + '.json'),
      output.contracts[CONTRACT_FILE_NAME][contract],
      {spaces: 2} // Indent json output with 2 spaces
    );
  }
} catch (err) {
  console.log(`Error: ${err}`);
}
