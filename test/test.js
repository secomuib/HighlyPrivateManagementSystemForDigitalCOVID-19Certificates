let chai = require("chai");
let chaiHttp = require("chai-http");
const { ethers } = require("hardhat");
//const { getTypeParameterOwner } = require("typescript");
const expect = require('chai').expect;

chai.use(chaiHttp);
const url= 'http://127.0.0.1:5000';

describe("WHO", function() {

  let who;
  let owner,lab1, lab2, user1, user2, noUser;
  let user1SCaddr, user2SCaddr;
  let user, lab, user2_Inst;
  let pubKey1, privKey1;
  let pubKey1New;
  let pubKey2;

  it("Address asignment", async function(){
    [owner,lab1, lab2, user1, user2, noUser] = await ethers.getSigners();
  })

  it("Deploys WHO smart contract", async function () {
    const Who = await ethers.getContractFactory('who');
    who = await Who.deploy();
    await who.deployed(); 

    expect(who.address).to.not.be.undefined;

    console.log(owner.address)
    //console.log(who.address)
  });

  it("New laboratory", async function (){
    const lab1Name = 'lab1';
    
    //console.log(lab1.address)
    
    await who.registerLab(lab1.address, lab1Name);
    
    const labInfo = await who.getLabInfo(lab1.address);
    expect(labInfo[0]).to.be.equal(lab1Name);
    expect(labInfo[1]).to.be.equal(true);
    expect(await who.getLabsCount()).to.be.equal(1);

    let transaction;
    try{
      transaction = await who.connect(noUser).registerLab(lab1.address, lab1Name);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
  })
    
  it("Laboratory removal", async function (){
    const lab2Name = 'lab2';
    
    await who.registerLab(lab2.address, lab2Name);
    
    let labInfo = await who.getLabInfo(lab2.address);
    expect(labInfo[0]).to.be.equal(lab2Name);
    expect(labInfo[1]).to.be.equal(true);
    expect(await who.getLabsCount()).to.be.equal('0x02');

    const labSC = await who.getLabSC(lab2.address);
    await who.deleteLab(lab2.address, labSC);
    
    labInfo = await who.getLabInfo(lab2.address);
    expect(labInfo[1]).to.be.equal(false);
  })

  it("User1 Keys creation", (done) => {
    chai.request(url).get('/keysCreation').end(function(err, res){
      pubKey1 = res.body.alices_public_key;
      //console.log(pubKey1)
      privKey1 = res.body.alices_private_keyBytes;
      done();
    });
  });

  it("Register user1", async() => { 
    //console.log(pubKey1);
    await who.connect(user1).registerUser(user1.address, pubKey1);

    expect(await who.connect(user1).getUserSC(user1.address)).to.not.be.undefined;
  });

  it("Register entity", async() => {
    await who.Entity(true, user1.address);

    user1SCaddr = await who.connect(user1).getUserSC(user1.address);
    const User = await ethers.getContractFactory('user');
    
    user = User.attach(user1SCaddr)
    expect(await user.getEntity()).to.be.equal(true);

    let transaction;
    try{
      transaction = await who.connect(noUser).Entity(true, user1.address);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
  });

  it("Removal entity", async() => {
    await who.Entity(false, user1.address);
    
    expect(await user.getEntity()).to.be.equal(false);

    let transaction;
    try{
      transaction = await who.connect(noUser).Entity(true, user1.address);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }

  });

  it("New document", async() => {
    let hash;
    let capsule;

    let transaction;

    let plaintext = JSON.stringify({
      nombre: 'Rosa',
      apellidos: 'Pericàs Gornals',
      prueba: 'Vacunación',
      resultado: '',
      nacimiento: '04-03-1999',
      fechaExpedicion: '12-08-2021',
      periodoValidez: '12-08-2022'
    });

    let plaintext_Base64 = Buffer.from(plaintext).toString("base64");
    //console.log(plaintext_Base64);
    const response = await chai.request(url).post('/encryption')
    .send({clau: pubKey1, plaintext: plaintext_Base64})
    
    hash = response.body.hash;
    capsule = response.body.capsule;
    
    const labSC = await who.getLabSC(lab1.address);

    const Lab = await ethers.getContractFactory('lab');
    lab = Lab.attach(labSC);

    await lab.connect(lab1).uploadCert(user1SCaddr, hash, capsule);
    expect(await user.connect(user1).getIndexDoc(hash)).to.not.be.undefined;
    const docsInfo = await user.connect(user1).getDocsInfo(0);
    expect(docsInfo[0]).to.not.be.undefined;
    expect(docsInfo[1]).to.not.be.undefined;
    expect(await user.connect(user1).lengthDocArray()).to.not.be.equal(0);

    try{
      transaction = await lab.connect(noUser).uploadCert(user1SCaddr, hash, capsule);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
    try{
      transaction = await user.connect(user1).newDoc(hash, capsule);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
  })

  it("Laboratory removal by impersonation", async() => {
    let transaction;
    try{
      transaction = await lab.connect(noUser).destruct();
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
  })

  it("User2 Keys creation", (done) => {
    chai.request(url).get('/keysCreation').end(function(err, res){
      pubKey2 = res.body.alices_public_key;
      //console.log(pubKey2)
      privKey2 = res.body.alices_private_keyBytes;
      done();
    });
  });

  it("Register user2", async() => {
    await who.connect(user2).registerUser(user2.address, pubKey2);

    user2SCaddr = await who.connect(user2).getUserSC(user2.address);
    expect(await who.connect(user2).getUserSC(user2.address)).to.not.be.undefined;

    const User = await ethers.getContractFactory('user');
    user2_Inst = User.attach(user2SCaddr)
  });

  it("User2 request user1", async() => {
    await who.connect(user2).getAliceDocs(user1.address, user2.address);
    expect(await who.getNumRequests()).to.be.equal(1);

    const request = await who.obtainRequests(0);
    expect(await request.alice_address).to.be.equal(user1.address);
    expect(await request.entityReq).to.be.equal(user2.address);
    
  });

  it("noUser request user1", async() => {
    let transaction;
    try{
      transaction = await who.connect(noUser).getAliceDocs(user1.address, noUser.address);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
  })

  it("WHO Resolve user2 request user1", async() => { 
    await who.resolveAliceDocs(0);
    request = await who.obtainRequests(0);
    //console.log(request);

    expect(await request.alice_address).to.be.equal('0x0000000000000000000000000000000000000000');
    expect(await request.entityReq).to.be.equal('0x0000000000000000000000000000000000000000');

    expect(await user.connect(user1).getNumRequests()).to.be.equal(1);
  });

  it("User1 request user2 and WHO deny request", async() => {
    await who.connect(user1).getAliceDocs(user2.address, user1.address);
    expect(await who.getNumRequests()).to.be.equal(2);

    const request = await who.obtainRequests(1);
    expect(await request.alice_address).to.be.equal(user2.address);
    expect(await request.entityReq).to.be.equal(user1.address);

    await who.denySol(1);
    const requestdeny = await who.obtainRequests(1);
    expect(await requestdeny.alice_address).to.be.equal('0x0000000000000000000000000000000000000000');
    expect(await requestdeny.entityReq).to.be.equal('0x0000000000000000000000000000000000000000');
  });

  it("User1 response user2", async() => {
    expect(await user.connect(user1).getNumRequests()).to.be.equal(1);
    let requests = await user.connect(user1).obtainRequests(0);
    expect(await requests).to.not.be.equal('0x0000000000000000000000000000000000000000');
    const pubKeyUser2 = await user2_Inst.connect(user1).getPubKey();
    
    const response = await chai.request(url).post('/reencryptAlice')
    .send({pubKey_Entitat: pubKeyUser2, private_key_Alice: privKey1});
    
    kfrags0 = response.body.kfrags0;
    alices_verifying_key = response.body.alices_verifying_key;

    const docsInfo = await user.connect(user1).getDocsInfo(0);
    const capsule = docsInfo[0];
    const hash = docsInfo[1];

    //Comprovam que si no és un usuari del sistema qui vol realitzar la compartició el modifier onlyUser no ho permet.
    let transaction;
    try{
      transaction = await user2_Inst.connect(noUser).newExtDoc(hash, pubKey1, capsule, kfrags0, alices_verifying_key);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }

    //Entrega correcte
    await user2_Inst.connect(user1).newExtDoc(hash, pubKey1, capsule, kfrags0, alices_verifying_key);
    await user.connect(user1).resolveSol(0);
    
    requests = await user.connect(user1).obtainRequests(0);
    expect(requests).to.be.equal('0x0000000000000000000000000000000000000000');
  });

  it("User2 obtain parameters document user1", async() => {
    expect(await user2_Inst.connect(user2).lengthExtDocArray()).to.not.be.equal(0);
    const hash = await user2_Inst.connect(user2).getExtDocs(0);
    expect(await user2_Inst.connect(user2).getExtInfo(hash)).to.not.be.undefined;
  })

  it("Entity(user1) request user2", async() =>{ 
    await who.Entity(true, user1.address);
    expect(await user.getEntity()).to.be.equal(true);
    await who.connect(user1).getAliceDocs(user2.address, user1.address);

    const request = await who.obtainRequests(2);
    expect(await request.alice_address).to.be.equal('0x0000000000000000000000000000000000000000');
    expect(await request.entityReq).to.be.equal('0x0000000000000000000000000000000000000000');

    let requests = await user2_Inst.connect(user2).obtainRequests(0);
    expect(requests).to.not.be.equal('0x0000000000000000000000000000000000000000');

    let transaction;
    try{
      transaction = await user2_Inst.connect(noUser).obtainRequests(0);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
  });

  /*it("New pubKey user1", async()=> {
    const response = await chai.request(url).get('/keysCreation')
    pubKey1New = response.body.alices_public_key;
    privKey1New = response.body.alices_private_keyBytes;
    
    //console.log(pubKey1New)

    await user.connect(user1).newPubKey(pubKey1New);
    expect(await user.connect(user1).getPubKey()).to.be.equal(pubKey1New);
  });*/

  it("New request to user smart contract from a false user", async() => {
    let transaction;
    try{
      transaction = await user.connect(noUser).newSol(noUser.address);
    }catch(e){
      chai.assert.ok(e);
      chai.assert.ok(!transaction);
    }
  });

  
})