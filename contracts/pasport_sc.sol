// SPDX-License-Identifier: MIT

pragma solidity >0.7.4;

contract who{
    //Direcció del propietari de l'smart contract de l'Organització Mundial de la Salut
    address owner = 0x959FD7Ef9089B7142B6B908Dc3A8af7Aa8ff0FA1;

    //Definició de variables
    address SC_WHO;
    address[] public Active_Labs;
    address[] public Active_Users;
    uint256 numRequests = 0;

    //Definició de mappings 
    mapping (uint256 => request) public requests;
    mapping (address => struct_Lab) public Lab;
    mapping (address => address) public userSC;
    
    //Definició d'estructures    
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

    //Constructor 
    constructor(){
        SC_WHO = address(uint160(address(this)));    
    }

    //------ FUNCIONS ------
    //------ Gestió de laboratoris------

    //Registre d'un nou laboratori al sistema
    event newLab(string labName, address adr_lab);
    function registerLab(address payable _lab, string memory _name) public onlyOwner() {
        Lab[_lab].sc_adr = address(new lab(_lab, SC_WHO));
        Active_Labs.push(_lab);
        Lab[_lab].name=_name;
        Lab[_lab].active = true;
        emit newLab(_name, _lab);
    }
    
    //Baixa d'un laboratori (destrucció de l'smart contract)
    event labDeleted(address adr_lab, string labname);
    function deleteLab(address _lab, address _sc_adr) public onlyOwner(){
        Lab[_lab].active = false;
        lab(_sc_adr).destruct();
        string storage labname = Lab[_lab].name;
        emit labDeleted(_lab, labname);
    }
    
    //Nombre de laboratoris registrats
    function getLabsCount()public view onlyOwner() returns(uint256){
        return Active_Labs.length;        
    }

    //Nom d'un laboratori registrat
    /*function getLabName(address adr_Lab) public view onlyOwner() returns(string memory){
        return Lab[adr_Lab].name;
    }
    
    //Estat d'un laboratori registrat (actiu - inactiu)
    function getLabState(address adr_Lab) public view onlyOwner() returns(bool){
        return Lab[adr_Lab].active;
    }*/
    
    function getLabInfo(address adr_Lab) public view onlyOwner()returns(string memory, bool){
        return (Lab[adr_Lab].name, Lab[adr_Lab].active);
    }

    //Smart contract d'un laboratori registrat
    function getLabSC(address adr_Lab) public view returns(address){
        return Lab[adr_Lab].sc_adr;
    }

    //------ Gestió d'usuaris ------

    //Registre d'un nou usuari
    event new_User(address);
    function registerUser(address _owner, string memory _pubKey) external returns (address) {
        address userOwner = _owner;
        address sc_adr = address(new user(userOwner, _pubKey, SC_WHO));
        Active_Users.push(userOwner);
        userSC[userOwner] = sc_adr;
        
        emit new_User(userOwner);
        return (sc_adr);
    }
    
    //Obtenció de l'adreça de l'smart contract d'un usuari
    function getUserSC(address adr_User) public view returns(address){
        return userSC[adr_User];
    }  

    //Solicitud externa d'un certificat d'un usuari
    function getAliceDocs(address _alices_address, address _entity_address) public onlyUser(){
        requests[numRequests].alice_address = _alices_address;
        requests[numRequests].entity = _entity_address;
        requests[numRequests].resolved = false;
        address entitySC = userSC[_entity_address];
        if(user(entitySC).getEntity()){
            who(SC_WHO).resolveAliceDocs(numRequests);
        }
        numRequests = numRequests + 1;
    }

    //Resolució d'una sol·licitud
    function resolveAliceDocs(uint256 _identifier) public onlyOwner(){
        address aliceAdr = requests[_identifier].alice_address;
        address aliceSC = userSC[aliceAdr];
        address entitat = requests[_identifier].entity;
        requests[_identifier].resolved = true;
        user(aliceSC).newSol(entitat);
    }

    //Denegació d'una sol·licitud
    function denySol(uint256 _identifier) public onlyOwner(){
        requests[_identifier].resolved = true;
    }

    //Obtenció del nombre de peticions existents
    function getNumRequests() public view onlyOwner() returns(uint256) {
        return numRequests;
    }

    //Obtenció de la informació correponent a una sol·licitud
    function obtainRequests(uint256 _identifier) public view onlyOwner() returns(address alice_address, address entityReq) {
        if(!requests[_identifier].resolved){
            return (requests[_identifier].alice_address, requests[_identifier].entity);
        }
    }

    //Gestió d'entitats
    //Activació/Desactivació de l'atribut d'entitat fiable
    event entity(address, bool);
    function Entity(bool active, address _entityAdr) public onlyOwner(){
        address entitySC = userSC[_entityAdr];
        user(entitySC).activeEntity(active);
        emit entity(_entityAdr, active);
    }
      
    // Modifier
    modifier onlyOwner(){
        require(msg.sender == owner || msg.sender == SC_WHO, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }  
    
    modifier onlyUser(){
        require(getUserSC(msg.sender) != 0x0000000000000000000000000000000000000000, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
}

contract lab{

    //Definició de variables
    address payable  owner;
    string hashA;
    address whoSC_Addr;
    
    //------ FUNCIONS ------
    //Constructor de l'smart contract
    constructor(address payable _lab, address _whoSC_Addr){
        owner = _lab;
        whoSC_Addr = _whoSC_Addr;
    }

    //Càrrega d'un nou document a l'smart contract d'un usuari del sistema
    event newDocument(address);
    function uploadCert(address _alice_SC_Adr, string memory _hashDoc, string memory _capsule) public onlyOwner(){
        user(_alice_SC_Adr).newDoc(_hashDoc, _capsule);
        emit newDocument(_alice_SC_Adr);
    }

    //Funció de baixa del laboratori, destrucció de l'smart contract
    event labRemoval(address);
    function destruct()external onlyWHO(){
        emit labRemoval(owner);
        selfdestruct(owner);
    }
    
    function getOwner() public view returns(address labOwner){
        return owner;
    }

    //------MODIFIERS------
    modifier onlyOwner(){
        require(msg.sender == owner, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }

    modifier onlyWHO(){
        require(msg.sender == whoSC_Addr, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
}

contract user{ 
    
    //Definició de variables
    string pubKey;
    string [] public docs;
    string [] public capsule;
    string [] public extDocs;

    //address sc_adr;
    address owner;
    address whoSC_Addr;
    bool entity;
    uint256 numRequests = 0;
    
    //Definició de mappings
    mapping (string => uint256) public indexDocs;
    mapping (string => externalDocParams) public extDocParams;
    mapping (uint256 => request) public requests;
    
    //Definició d'estructures
    struct request{
        bool resolved;
        address entity_address;
    }
    
    struct externalDocParams{
        string exthash;
        string extPubKey;
        string capsule;
        string kfrag0;
        string verifyingKey;
    }
    
    //------FUNCIONS------
    //Constructor
    constructor(address _owner, string memory  _pubKey, address _whoSC_Addr) {
        owner = _owner;
        whoSC_Addr = _whoSC_Addr;
        pubKey = _pubKey;
        entity = false;
    }

    //------Gestió de la clau d'encriptació pública de l'usuari------
    //Obtenció de la clau pública de l'usuari
    function getPubKey() view public returns(string memory publicKey){
        return (pubKey); 
    }

    //Introducció d'una nova clau pública, per a substituir l'anterior
    /*function newPubKey(string memory _pubKey) public onlyOwner(){
        pubKey = _pubKey;
    }*/
    
    //------Gestió de certificats------
    //Introducció d'un nou certificats, execució des d'un laboratori del sistema
    function newDoc(string memory _hash, string memory _capsule) public onlyLab(){
        uint256 index= docs.length;
        indexDocs[_hash] = index;
        capsule.push(_capsule);
        docs.push(_hash);
    }
    
    //Introducció d'un certificat extern, propietat d'un altre usuari del sistema
    function newExtDoc(string memory _hash, string memory _pubKeyUser, string memory _capsule, string memory _kfrag0, string memory _alicesVerifyingKey) public onlyUser(){
        extDocs.push(_hash);
        extDocParams[_hash].extPubKey = _pubKeyUser;
        extDocParams[_hash].capsule = _capsule;
        extDocParams[_hash].kfrag0 = _kfrag0;
        extDocParams[_hash].verifyingKey = _alicesVerifyingKey;
    }

    //Funcions per a l'obtenció dels paràmetres que defineixen els diferents certificats emmagatzemats a l'smart contract
    function getIndexDoc(string memory _hash) public view onlyOwner() returns (uint256 index){
        return indexDocs[_hash];
    }

    function getDocsInfo(uint _index) public view onlyOwner() returns(string memory, string memory){
        return (docs[_index], capsule[_index]);
    }


    /*function getDocsHash(uint _index) public view onlyOwner() returns(string memory){
        return docs[_index];
    }

    function getDocsCapsule(uint _index) public view onlyOwner() returns (string memory){
        return capsule[_index];
    }*/
    
    function getExtDocs(uint _index) public view onlyOwner() returns(string memory) {
        return extDocs[_index];
    }
    
    function getExtInfo(string memory _hash) public view onlyOwner() returns (string memory, string memory, string memory, string memory){
        return (extDocParams[_hash].extPubKey, extDocParams[_hash].capsule, extDocParams[_hash].kfrag0, extDocParams[_hash].verifyingKey);
    }

    //Funcions per obtenir el nombre de documents tant propietat de l'usuari com externs
    function lengthDocArray() public view onlyOwner() returns(uint){
        return docs.length;
    }

    function lengthExtDocArray() public view onlyOwner() returns(uint){
        return extDocs.length;
    }   
    
    //------Gestió d'entitat------
    //Activació / desactivació de la característica d'entitat
    function activeEntity(bool _active) public onlyWHO() {
        entity = _active;
    }
    
    //Obtenció del valor de la característica d'entitat (activa o inactiva)
    function getEntity()public view returns (bool){
        return entity;
    }
    
    //------Gestió de sol·licituds externes------
    //Introducció d'una nova sol·licitud d'enviament de certificat
    function newSol(address _entityAdr) public onlyWHO() {
        requests[numRequests].entity_address = _entityAdr;
        requests[numRequests].resolved = false;
        numRequests = numRequests + 1;
    }

    //Resolució d'una sol·licitud
    function resolveSol(uint256 _identifier) public onlyOwner(){
        requests[_identifier].resolved = true;
    }
    
    //Obtenció d'una petició emmagatzemada a l'smart contract
    function obtainRequests(uint256 _identifier) public view onlyOwner() returns(address entityReq) {
        if(!requests[_identifier].resolved){
            return (requests[_identifier].entity_address);
        }
    }
    
    //Obtenció del nombre de peticions total
    function getNumRequests() public view onlyOwner() returns(uint256) {
        return numRequests;
    }

    //------MODIFIERS------
    modifier onlyOwner(){
        require(msg.sender == owner, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
    
    modifier onlyWHO(){
        require(msg.sender == whoSC_Addr, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
    
    modifier onlyLab(){
        address lab_owner = lab(msg.sender).getOwner();
        require(who(whoSC_Addr).getLabSC(lab_owner) != 0x0000000000000000000000000000000000000000, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
    
    modifier onlyUser(){
         require(who(whoSC_Addr).getUserSC(msg.sender) != 0x0000000000000000000000000000000000000000, "L'adresa que ha realitzat la crida no te els permissos de propietat.");
        _;
    }
}