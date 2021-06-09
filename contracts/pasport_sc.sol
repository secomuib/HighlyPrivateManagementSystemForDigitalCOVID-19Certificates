// SPDX-License-Identifier: MIT

pragma solidity >0.7.4;

contract who{
    //Direcció del propietari 
    address owner = 0x70F6714dCa2f53A17558C5dff99D572959f77D9c;
    address SC_WHO;
    address[] public Active_Labs;
    address[] public Active_Users;
    mapping (uint256 => request) public requests;
    mapping (address => struct_Lab) public Lab;
    mapping (address => address) public userSC;
    uint256 numRequests = 0;
    
    struct struct_Lab{
        string name;
        bool active;
        address sc_adr;
    }

    struct request{
        bool resolved;
        address alice_address;
        address entity;
    }

    constructor(){
        SC_WHO = address(uint160(address(this)));    
    }


    event newLab(string, address);
    function registerLab(address payable _lab, string memory _name) public onlyOwner() {
        Lab[_lab].sc_adr = address(new lab(_lab));
        Active_Labs.push(_lab);
        Lab[_lab].name=_name;
        Lab[_lab].active = true;
        emit newLab(_name, _lab);
    }
    
    event new_User(address);
    function registerUser(address _owner, string memory _pubKey) external returns (address) {
        address userOwner = _owner;
        address sc_adr = address(new user(userOwner, _pubKey, SC_WHO));
        Active_Users.push(userOwner);
        userSC[userOwner] = sc_adr;
        
        emit new_User(userOwner);
        return (sc_adr);
    }
    
    event entity(address, bool);
    function Entity(bool active, address _entityAdr) public onlyOwner(){
        address entitySC = userSC[_entityAdr];
        user(entitySC).activeEntity(active);
        emit entity(_entityAdr, active);
    }
    
    function getLabsCount()public view onlyOwner() returns(uint256){
        return Active_Labs.length;        
    }

    /*function getUsersCount()public view onlyOwner() returns(uint256){
        return Active_Users.length;        
    }*/

    /*function getLab(uint _index) public view onlyOwner() returns(address){
        return Active_Labs[_index];
    }*/

    function getLabName(address adr_Lab) public view onlyOwner() returns(string memory){
        return Lab[adr_Lab].name;
    }
    
    function getLabState(address adr_Lab) public view onlyOwner() returns(bool){
        return Lab[adr_Lab].active;
    }
    
    function getLabSC(address adr_Lab) public view returns(address){
        return Lab[adr_Lab].sc_adr;
    }
    
    function getUserSC(address adr_User) public view returns(address){
        return userSC[adr_User];
    }
    
    function getWHO_sc_address() public view returns (address) {
        return SC_WHO;
    }

    function deleteLab(address _lab, address _sc_adr) public onlyOwner(){
        Lab[_lab].active = false;
        lab(_sc_adr).destruct();
    }

    function getAliceDocs(address _alices_address, address _entity_address) public {
        requests[numRequests].alice_address = _alices_address;
        requests[numRequests].entity = _entity_address;
        requests[numRequests].resolved = false;
        address entitySC = userSC[_entity_address];
        if(user(entitySC).getEntity()){
            who(SC_WHO).resolveAliceDocs(numRequests);
        }
        numRequests = numRequests + 1;
    }

    function getNumRequests() public view onlyOwner() returns(uint256) {
        return numRequests;
    }   

    function obtainRequests(uint256 _identifier) public view onlyOwner() returns(address alice_address, address entityReq) {
        if(!requests[_identifier].resolved){
            return (requests[_identifier].alice_address, requests[_identifier].entity);
        }
    }
    
    function resolveAliceDocs(uint256 _identifier) public onlyOwner(){
        address aliceAdr = requests[_identifier].alice_address;
        address aliceSC = userSC[aliceAdr];
        address entitat = requests[_identifier].entity;
        requests[_identifier].resolved = true;
        user(aliceSC).newSol(entitat);
    }

    function denySol(uint256 _identifier) public onlyOwner(){
        requests[_identifier].resolved = true;
    }
    
    modifier onlyOwner(){
        require(msg.sender == owner || msg.sender == SC_WHO, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
    
    /*function addUser(address _user, address _sc)external{
        Active_Users.push(_user); 
        userSC[_user] = _sc;
    }*/
    
}
contract lab{
    
    address payable  owner;
    address scAddress;
    string hashA;
    
    
    constructor(address payable _lab){
        owner = _lab;
        scAddress = address (this);
    }

     modifier onlyOwner(){
        require(msg.sender == owner, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }

    function getOwner() public view returns(address){
        return(owner);
    }

    /*function document(string memory _hashDoc) public returns (string memory){
        hashA = _hashDoc;
        return(_hashDoc);
    }*/

    event newDocument(address);
    function carregaDocument(address _alice_SC_Adr, string memory _hashDoc, string memory _capsule) public onlyOwner() returns (string memory){
        
        user(_alice_SC_Adr).newDoc(_hashDoc, _capsule);

        emit newDocument(_alice_SC_Adr);
        return(hashA);
    }

    event bajaLaboratorio(address);
    function destruct()external{
        selfdestruct(owner);
        emit bajaLaboratorio(owner);
    }
}

contract user{ 
    
    string pubKey;
    string [] public docs;
    string [] public capsule;
    string [] public extDocs;
    //string [] public extCapsule;
    //string [] public extKfrags;
    //string [] public userPubKey;

    address sc_adr;
    address owner;
    address whoSC_Addr;
    bool entity;
    uint256 numRequests = 0;
    
    mapping (string => uint256) public indexDocs;
    //mapping (string => uint256) index_extDocs;
    mapping (string => kfrags) public kfrag;
    mapping (uint256 => request) public requests;
    
    struct request{
        bool resolved;
        address entity_address;
    }
    
    struct kfrags{
        string exthash;
        string extPubKey;
        string capsule;
        string kfrag0;
        string verifyingKey;
    }
    
    constructor(address _owner, string memory  _pubKey, address _whoSC_Addr) {
        owner = _owner;
        sc_adr = address(uint160(address(this)));
        whoSC_Addr = _whoSC_Addr;
        pubKey = _pubKey;
        entity = false;
    }
//Es pot elminar no és necessari:
    /*function getOwner() view public returns(address) {
        return (owner);
    }
//Es pot elminar no és necessari:
    function getMSGSender()  view public returns(address) {
        return (msg.sender);
    }*/

    function getPubKey() view public returns(string memory publicKey){
        return (pubKey); 
    }

    function newPubKey(string memory _pubKey) public onlyOwner(){
        pubKey = _pubKey;
    }
    
    function newDoc(string memory _hash, string memory _capsule)public{
        uint256 index= extDocs.length;
        indexDocs[_hash] = index;
        capsule.push(_capsule);
        docs.push(_hash);
        emit nouDoc(_hash);
    }
    event nouDoc(string);

    function getIndexDoc(string memory _hash) public view onlyOwner() returns (uint256 index){
        return indexDocs[_hash];
    }
    
    function newExtDoc(string memory _hash, string memory _pubKeyUser, string memory _capsule, string memory _kfrag0, string memory _alicesVerifyingKey ) public{
        //uint256 index = extDocs.length;
        //index_extDocs[_hash] = index;
        //extCapsule.push(_capsule);
        extDocs.push(_hash);
        kfrag[_hash].extPubKey = _pubKeyUser;
        kfrag[_hash].capsule = _capsule;
        kfrag[_hash].kfrag0 = _kfrag0;
        kfrag[_hash].verifyingKey = _alicesVerifyingKey;
    }

    function getDocsHash(uint _index) public view onlyOwner() returns(string memory){
        return docs[_index];
    }

    function getDocsCapsule(uint _index) public view onlyOwner() returns (string memory){
        return capsule[_index];
    }
    
    function getExtDocs(uint _index) public view onlyOwner() returns(string memory) {
        return extDocs[_index];
    }
    
    /*function getExtPubKey(string memory _hash) public view returns (string memory){
        uint256 index = index_extDocs[_hash];
        return userPubKey[index];
    }*/

    /*function getExtCapsule(string memory _hash) public onlyOwner() view returns(string memory) {
        uint256 index = index_extDocs[_hash];
        return extCapsule[index];
    }
    function getExtKfrags(string memory _hash) public onlyOwner() view returns(string memory) {
        uint256 index = index_extDocs[_hash];
        return extKfrags[index];
    }
*/

    function getExtInfo(string memory _hash) public view onlyOwner() returns (string memory, string memory, string memory, string memory){
        return (kfrag[_hash].extPubKey, kfrag[_hash].capsule, kfrag[_hash].kfrag0, kfrag[_hash].verifyingKey);
    }
//No s'utilitza es pot eliminar
    function getContractAddress()public view onlyOwner() returns(address){
        return sc_adr;
    }

    function lengthDocArray() public view onlyOwner() returns(uint){
        return docs.length;
    }

    function lengthExtDocArray() public view onlyOwner() returns(uint){
        return extDocs.length;
    }   
    
    function activeEntity(bool _active) public onlyWHO() {
        entity = _active;
    }
    
    function getEntity()public view returns (bool){
        return entity;
    }
    
    function newSol(address _entityAdr) public onlyWHO() {
        requests[numRequests].entity_address = _entityAdr;
        requests[numRequests].resolved = false;
        numRequests = numRequests + 1;
    }
    
    function getNumRequests() public view onlyOwner() returns(uint256) {
        return numRequests;
    }

    function obtainRequests(uint256 _identifier) public view onlyOwner() returns(address entityReq) {
        if(!requests[_identifier].resolved){
            return (requests[_identifier].entity_address);
        }
    }

    function resolveSol(uint256 _identifier) public onlyOwner(){
        requests[_identifier].resolved = true;
    }
    

    modifier onlyOwner(){
        require(msg.sender == owner, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
    
    modifier onlyWHO(){
        require(msg.sender == whoSC_Addr, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }

    modifier onlyLab(){
        
        require(who(whoSC_Addr).getLabState(msg.sender), "L'adresa que ha realitzat la crida no es correspon amb cap laboratori fiable.");
        _;
    }
}