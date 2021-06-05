import web3 from './web3';

const user = require('./build/user.json');

export default (address) => {
    return new web3.eth.Contract(
        user.abi,
        address
    );
}