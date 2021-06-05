import web3 from './web3';

//const path = require("path");
//const fs = require("fs-extra"); // fs with extra functions

const who = require('./build/who.json');

const instance = new web3.eth.Contract(
    who.abi,
    who.address
);
console.log(instance);

export default instance;