import React, { Component } from 'react';
import who from '../ethereum/who';
import user from '../ethereum/user';
import web3 from '../ethereum/web3';
import Swal from 'sweetalert2';
import { Form, Divider, Button, Message, Segment, Input, Dimmer, Loader, Table, Icon } from 'semantic-ui-react';
import LlistatDocuments from '../components/LlistatDocuments';
import axios from 'axios';


class User extends Component {

  constructor(props) {
    super(props)

    this.state = {
      address: '',
      addressEnt: '',
      ipfsHash: [],
      extIPFSHash: [],
      docHash: '',
      externalDocs: false,
      entidad: false,
      kfrags0:'',
      alices_verifying_key:'',
      loading: false,
      loadingPage: true,
      errorMessageAlta: '',
      buffer: null
    }
  };

  //Funció per a enviar un document des de l'usuari cap a una entitat fiable
  sendDoc = async event => {
    if (this.state.enviar == false) {
      event.preventDefault();
    }
    this.setState({ loading: true, errorMessageAlta: '' });
    try {
      //COMPROVACIÓ QUE L'ADREÇA INTRODUÏDA PERTANY A UNA USUARI/ENTITAT FIABLE
      const accounts = await web3.eth.getAccounts();
      console.log('address ent: ' + this.state.addressEnt);
      const scAddr = await who.methods.getUserSC(this.state.addressEnt).call({from: accounts[0]});
      console.log('scAddr ' + scAddr);

      let entityInstance = user(scAddr);

      if (await entityInstance.methods.getEntity().call({from: accounts[0]}) === true) {
        //Obtenim la clau pública de l'entitat a la qual li volem enviar el document
        const pubKey_Entitat = await entityInstance.methods.getPubKey().call();
        console.log('pubKeyEntitat: ' + pubKey_Entitat);

        //Creem la variable per a consultar la clau privada des del navegador
        const myStorage = window.localStorage;

        //Realitzam la petició de reencriptació a pyUmbral
        await fetch('/reencryptAlice', {
          method: 'POST',
          body: JSON.stringify({
            pubKey_Entitat: pubKey_Entitat,
            private_key_Alice: myStorage.getItem('clau privada usuari ' + accounts),  
          }),
          headers:{
            'Content-type': 'application/json',
          }
        }).then(response => response.json()
        
        ).then(result=> {
          console.log('Result ' + result.kfrags0)
          console.log('Result ' + result.alices_verifying_key)
          this.setState({
            kfrags0: result.kfrags0,
            alices_verifying_key: result.alices_verifying_key
          });
        })
        const instance = await user(this.state.address);
        console.log('Hash: ' + this.state.docHash);
        const index = await instance.methods.getIndexDoc(this.state.docHash).call({from: accounts[0]});
        console.log('Index: ' + index);
        const capsule = await instance.methods.getDocsCapsule(index).call({from: accounts[0]});
        console.log('capsule '+ capsule);
        const pubKeyUser =  await instance.methods.getPubKey().call();
        console.log('pubKeyUser ' + pubKeyUser);
        entityInstance.methods.newExtDoc(this.state.docHash, pubKeyUser, capsule, this.state.kfrags0, this.state.alices_verifying_key).send({ from: accounts[0] });
        console.log('kfrags[0] ' + this.state.kfrags0)
        //entityInstance.methods.newExtDoc(this.state.docHash).send({ from: accounts[0] });
        //window.location.reload();
      } else {
        //En cas que l'adreça no es correspongui amb la de cap entitat verificada, s'avisa a l'usuari i s'acaba la transacció
        Swal.fire({
          title: 'La dirección introducida no se corresponde con la de ninguna entidad verificada.',
          icon: 'warning',
          showCloseButton: true,
          confirmButtonText: 'Aceptar',
          width: 600,
          padding: '3em',
          backdrop: `
            left top
            no-repeat
          `
        }).then((result) => {
          if (result.isConfirmed) {

          }
        })
      }
    } finally {
      this.setState({
        loading: false
      });
    }
  };

  componentDidMount = async () => {
    try {
      var instance = '';
      const accounts = await web3.eth.getAccounts();
      var address = await who.methods.userSC(accounts[0]).call();
      console.log("RESPOSTA " + address);

      //Comprovam si la direcció Ethereum ja té desplegat l'Smart Contract user
      if (address === "0x0000000000000000000000000000000000000000") {

        //CREACIÓ DE LES CLAUS DE L'USUARI I EMMAGATZEMAMENT D'AQUESTES AL NAVEGADOR
        await fetch('/keysCreation').then(function (response) {
          return response.json();
        }).then(function (text) {
          console.log('pubKey: ');
          console.log(text.alices_public_key)
          address = who.methods.registerUser(accounts[0], text.alices_public_key).send({ from: accounts[0] });
          const myStorage = window.localStorage;
          myStorage.setItem('clau privada usuari ' + accounts, text.alice_secret_key);
          myStorage.setItem('clau publica usuari ' + accounts, text.alices_public_key);
         
         });
        /*const myStorage = window.localStorage;
        myStorage.setItem('claus usuari ' + accounts, JSON.stringify(data));
        this.setState({
          claus: data
        });*/

        //Registrem l'usuari --> desplegament de l'SC
        //address = await who.methods.registerUser(this.state.claus['alices_public_key']).send({from: accounts[0]});
        //console.log("Contract Address user: " + address);
        var address = await who.methods.userSC(accounts[0]).call();
        instance = await user(address);
        console.log('Instance: ' + typeof (instance));

      } else {

        instance = await user(address);
        const alice_PubKey = await instance.methods.getPubKey().call();
        console.log('alice_public_key' + alice_PubKey)

        const myStorage = window.localStorage;
        //console.log(myStorage.getItem('claus usuari ' + accounts));

        //Si al navegador de l'usuari no hi ha clau públiques
        if ((myStorage.getItem('clau privada usuari ' + accounts) == null) && (myStorage.getItem('clau privada usuari ' + accounts) == null)) {
          /*Swal.fire({
            title: 'Es necesario actualizar las llaves del usuario.',
            text: '¿Desea realizarlo ahora?',
            showCloseButton: true,
            showDenyButton: true,
            confirmButtonText: 'Continuar',
            denyButtonText: 'Cancelar',
            width: 600,
            padding: '3em',
            backdrop: `
              left top
              no-repeat
            `
        }).then((result) => {
          if(result.isConfirmed){*/

          //CREACIÓ DE LES CLAUS DE L'USUARI I EMMAGATZEMAMENT D'AQUESTES AL NAVEGADOR
         /* await axios.get('/private-key-creation').then((response) => {
            const { data } = (response);
            console.log('Data ' + data);

            const myStorage = window.localStorage;
            myStorage.setItem('clau privada usuari ' + accounts, data);
            console.log(typeof(data))
            this.pubKey(data);
            

          });*/

          
          
          axios.get('/keysCreation').then((response) => {
            const { data } = (response);
            console.log('Data ' + data);

            const myStorage = window.localStorage;
            myStorage.setItem('clau privada usuari ' + accounts, data['alices_private_keyBytes']);
            myStorage.setItem('clau publica usuari ' + accounts, data['alices_public_key']);
            //Introduïm la nova adreça pública a l'SC de l'usuari 
            instance.methods.newPubKey(data['alices_public_key']).send({ from: accounts[0] });
            this.setState({
              claus: data
            });
          });
        


         /* instance.methods.newPubKey(this.state.claus['alices_public_key']).send({from: accounts[0]});
          
            }else if(result.isDenied){
              console.log('Denegado')
            }
          })*/
          }


          const NumDocumentos = await instance.methods.lengthDocArray().call({from: accounts[0]});
          console.log("NUM DOCS: " + NumDocumentos);
          console.log('Instance: ' + typeof (instance));
          const hash = await Promise.all(
            Array(parseInt(NumDocumentos))
              .fill()
              .map((delivery, index) => {
                console.log(index);
                return instance.methods.getDocsHash(index).call({from: accounts[0]});
              })
          );

          console.log('HASH: ' + hash)

          const numExtDoc = await instance.methods.lengthExtDocArray().call({from: accounts[0]});
          console.log('numExtDoc ' + numExtDoc)
          const extHash = await Promise.all(
            Array(parseInt(numExtDoc))
              .fill()
              .map((delivery, index) => {
                console.log(index);
                return instance.methods.getExtDocs(index).call({from: accounts[0]});
              })
          );

          const entidad = await instance.methods.getEntity().call({from: accounts[0]});

          

          /*if (entidad === true && (await instance.methods.lengthExtDocArray().call({from: accounts[0]})>0)) {
            console.log(await instance.methods.getExtDocs(0).call({from: accounts[0]}));
          } else if (await instance.methods.lengthExtDocArray({from: accounts[0]}).call() > 0) {
            this.setState({
              externalDocs: true
            });
          }*/

          this.setState({
            address: address,
            ipfsHash: hash,
            extIPFSHash: extHash,
            entidad: entidad
          });
          console.log('Entidad: ' + this.state.entidad);
        };
      

    } finally {
      this.setState({ loadingPage: false })
    }
  }

  /*pubKey(data){
    console.log('pubKey data '+data)
    fetch('/public-key-creation', {
      method: 'POST',
      body: JSON.stringify({
        privada: data}),
      headers:{
        'Content-Type': 'application/json',
      }
    }).then(response => response.text()
    ).then(result => {
      console.log(result);
      /*const { data } = (response);
      console.log('Data ' + data);

      const myStorage = window.localStorage;
      myStorage.setItem('clau privada usuari ' + accounts, data);
      //Introduïm la nova adreça pública a l'SC de l'usuari 
      instance.methods.newPubKey().send({ from: accounts[0] });*/
   // });
 // }

renderDeliveryRows() {
    var deliveries;
    var entity;

    entity = this.state.entidad;
    console.log('Render delivery rows ' + entity);

    deliveries = this.state.ipfsHash;
    console.log('Hash render: ' + deliveries);
    

    return deliveries.map((delivery, index) => {
      return (
        <LlistatDocuments
          key={index}
          id={index}
          delivery={delivery}
          entitat = {entity}
        />
      );
    });
  };

  renderExternalRows() {
    var deliveries;
    var entity; 

    entity = this.state.entidad;

    deliveries = this.state.extIPFSHash;
    console.log('Hash render: ' + deliveries);

    return deliveries.map((delivery, index) => {
      return (
        <LlistatDocuments
          key={index}
          id={index}
          delivery={delivery}
          entitat = {entity}
        />
      );
    });
  };

  render() {
    // Loading
    if (this.state.loadingPage) return (
      <div>
        <Segment style={{ height: '80vh' }}>
          <Dimmer active inverted>
            <Loader inverted content='Loading...' />
          </Dimmer>
        </Segment>
      </div>
    );

    //Done
    return (
      <div>
        {(this.state.entidad) ? (<div>

          <Divider horizontal>
            <h3 style={{ textAlign: "center" }}>
              <Icon name='file alternate outline icon' circular />
                &nbsp; Documentos recibidos &nbsp;
              <Icon name='file alternate outline icon' circular />
            </h3>
          </Divider>

          <Table fixed>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell style={{ width: 90 }, { fontSize: '15px' }}>#</Table.HeaderCell>
                <Table.HeaderCell style={{ width: 300, textAlign: "center" }, { fontSize: '15px' }}>Hash documento IPFS</Table.HeaderCell>
                <Table.HeaderCell style={{ width: 300 }}></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>{this.renderExternalRows()}</Table.Body>
          </Table>

          <Divider horizontal>
            <h3 style={{ textAlign: "center" }}>
              <Icon name='comment alternate outline icon' circular />
                &nbsp; Solicitar documentos &nbsp;
              <Icon name='comment alternate outline icon' circular />
            </h3>
          </Divider>

        </div>)
          :
          (<div>

            <Divider horizontal>
              <h3 style={{ textAlign: "center" }}>
                <Icon name='folder open outline icon' circular />
                &nbsp; Mis certificados &nbsp;
              <Icon name='folder open outline icon' circular />
              </h3>
            </Divider>
            <Table fixed>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell style={{ width: 90 }, { fontSize: '15px' }}>#</Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 300, textAlign: "center" }, { fontSize: '15px' }}>Hash documento IPFS</Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 300 }, { fontSize: '15px' }}></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>{this.renderDeliveryRows()}</Table.Body>
            </Table>

            <Divider horizontal>
              <h3 style={{ textAlign: "center" }}>
                <Icon name='share icon' circular />
                &nbsp; Enviar certificado &nbsp;
              <Icon name='share icon' circular />
              </h3>
            </Divider>
            <Form onSubmit={this.sendDoc} error={!!this.state.errorMessageAlta}>

              <Form.Field>
                <label style={{ fontSize: '15px' }}>Dirección Ethereum entidad:</label>
                <Input
                  value={this.state.addressEnt}
                  onChange={event => this.setState({ addressEnt: event.target.value })}
                />
              </Form.Field>
              <Form.Field>
                <label style={{ fontSize: '15px' }}>Hash documento IPFS:</label>
                <Input
                  value={this.state.docHash}
                  onChange={event => this.setState({ docHash: event.target.value })}
                />
              </Form.Field>

              <Message error header="Error" content={this.state.errorMessageAlta} />

              <Button color='blue' style={{ marginBottom: '20px' }} size='large' onClick={() => this.sendDoc} enable loading={this.state.loading}>
                Enviar documento
          </Button>

              {this.state.externalDocs ? (<div>
                <h3>Documentos recibidos</h3>
                <Table fixed>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell style={{ width: 90 }}>#</Table.HeaderCell>
                      <Table.HeaderCell style={{ width: 300, textAlign: "center" }}>Hash documento IPFS</Table.HeaderCell>
                      <Table.HeaderCell style={{ width: 300 }}></Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>{this.renderExternalRows()}</Table.Body>
                </Table>
              </div>) : (<div>

              </div>)}
            </Form>
          </div>)}
      </div>
    );
  }

}
export default User;