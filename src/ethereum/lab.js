import web3 from './web3';

//const path = require("path");
//const fs = require("fs-extra"); // fs with extra functions

const lab = require('./build/lab.json');
export default (address) => {
    return new web3.eth.Contract(
        lab.abi,
        address
    );
}
