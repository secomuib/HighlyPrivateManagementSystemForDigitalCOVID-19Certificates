import React, { Component } from 'react';
import who from '../ethereum/who';
import user from '../ethereum/user';
import web3 from '../ethereum/web3';
import Swal from 'sweetalert2';
import { Form, Divider, Button, Message, Segment, Input, Dimmer, Loader, Table, Icon } from 'semantic-ui-react';
import LlistatDocuments from '../components/LlistatDocuments';
import LlistatSolicituds from '../components/LlistatSolicituds';
import axios from 'axios';


class User extends Component {

  constructor(props) {
    super(props)

    this.state = {
      address: '',
      addressEnt: '',
      addressUsuExt: '',
      ipfsHash: [],
      extIPFSHash: [],
      docHash: '',
      externalDocs: false,
      entidad: false,
      kfrags0: '',
      alices_verifying_key: '',
      Docsrequests: [],
      loading: false,
      loadingPage: true,
      errorMessageAlta: '',
      buffer: null
    }
  };

  //Funció per a enviar un document des de l'usuari cap a una entitat fiable
  sendDoc = async event => {
    /*try {
      if (this.state.enviar == false) {
        
      }*/
      try {
        event.preventDefault();
        this.setState({ loading: true, errorMessageAlta: '' });
        //COMPROVACIÓ QUE L'ADREÇA INTRODUÏDA PERTANY A UNA USUARI/ENTITAT FIABLE
        const accounts = await web3.eth.getAccounts();
        const scAddr = await who.methods.getUserSC(this.state.addressEnt).call({ from: accounts[0] });
        let entityInstance = user(scAddr);

        if (await entityInstance.methods.getEntity().call({ from: accounts[0] }) === true) {
          //Obtenim la clau pública de l'entitat a la qual li volem enviar el document
          const pubKey_Entitat = await entityInstance.methods.getPubKey().call();

          //Creem la variable per a consultar la clau privada des del navegador
          const myStorage = window.localStorage;

          //Realitzam la petició de reencriptació a pyUmbral
          await fetch('/reencryptAlice', {
            method: 'POST',
            body: JSON.stringify({
              pubKey_Entitat: pubKey_Entitat,
              private_key_Alice: myStorage.getItem('clau privada usuari ' + accounts),
            }),
            headers: {
              'Content-type': 'application/json',
            }
          }).then(response => response.json()

          ).then(result => {
            this.setState({
              kfrags0: result.kfrags0,
              alices_verifying_key: result.alices_verifying_key
            });
          })
          const instance = await user(this.state.address);
          const index = await instance.methods.getIndexDoc(this.state.docHash).call({ from: accounts[0] });
          const docsInfo = await instance.methods.getDocsInfo(index).call({ from: accounts[0] });
          const capsule = docsInfo[1];
          const pubKeyUser = await instance.methods.getPubKey().call();
          await entityInstance.methods.newExtDoc(this.state.docHash, pubKeyUser, capsule, this.state.kfrags0, this.state.alices_verifying_key).send({ from: accounts[0] });
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
      this.setState({ loading: false,
        addressEnt: '',
        docHash: ''});
    }
  };

  //Funció per a sol·licitar un certificat a un usuari extern
  requestDoc = async event => {
    try {
      event.preventDefault();
      this.setState({ loading: true, errorMessageAlta: '' });
      const accounts = await web3.eth.getAccounts();
      await who.methods.getAliceDocs(this.state.addressUsuExt, accounts[0]).send({ from: accounts[0] });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({
        loading: false,
        addressUsuExt: ''
      });
    }
  }

  componentDidMount = async () => {
    try {
      var instance = '';
      const accounts = await web3.eth.getAccounts();
      var address = await who.methods.userSC(accounts[0]).call();

      //Comprovam si la direcció Ethereum ja té desplegat l'Smart Contract user
      if (address === "0x0000000000000000000000000000000000000000") {

        //CREACIÓ DE LES CLAUS DE L'USUARI I EMMAGATZEMAMENT D'AQUESTES AL NAVEGADOR
        await fetch('/keysCreation').then(function (response) {
          return response.json();
        }).then(function (text) {
          address = who.methods.registerUser(accounts[0], text.alices_public_key).send({ from: accounts[0] });
          const myStorage = window.localStorage;
          myStorage.setItem('clau privada usuari ' + accounts[0], text.alices_private_keyBytes);
          myStorage.setItem('clau publica usuari ' + accounts[0], text.alices_public_key);

        });

        var address = await who.methods.userSC(accounts[0]).call();
        instance = await user(address);
        this.setState({ loadingPage: false })
      } else {
        instance = await user(address);
        const myStorage = window.localStorage;

        //Si al navegador de l'usuari no hi ha clau públiques
        if ((myStorage.getItem('clau privada usuari ' + accounts) == null) && (myStorage.getItem('clau privada usuari ' + accounts) == null)) {

          //Creem les claus de l'usuari i les emmagatzemem al navegador
          axios.get('/keysCreation').then((response) => {
            const { data } = (response);

            const myStorage = window.localStorage;
            myStorage.setItem('clau privada usuari ' + accounts, data['alices_private_keyBytes']);
            myStorage.setItem('clau publica usuari ' + accounts, data['alices_public_key']);
            //Introduïm la nova adreça pública a l'SC de l'usuari 
            instance.methods.newPubKey(data['alices_public_key']).send({ from: accounts[0] });
            this.setState({
              claus: data
            });
          });
        }


        const NumDocumentos = await instance.methods.lengthDocArray().call({ from: accounts[0] });
        const infoDocs = await Promise.all(
          Array(parseInt(NumDocumentos))
            .fill()
            .map((delivery, index) => {
              return instance.methods.getDocsInfo(index).call({ from: accounts[0] });
            })
        );
            console.log('infoDocs');
            console.log(infoDocs);

        const hash = await Promise.all(
          Array(parseInt(NumDocumentos))
          .fill()
          .map((delivery, index) => {
            console.log(index)
            return infoDocs[index][0];
          })
        );
        console.log('hash');
        console.log(hash);

        const numExtDoc = await instance.methods.lengthExtDocArray().call({ from: accounts[0] });
        if (numExtDoc >= 1) {
          this.setState({
            externalDocs: true
          });
        }
        const extHash = await Promise.all(
          Array(parseInt(numExtDoc))
            .fill()
            .map((delivery, index) => {
              return instance.methods.getExtDocs(index).call({ from: accounts[0] });
            })
        );

        const entidad = await instance.methods.getEntity().call({ from: accounts[0] });

        if (!entidad) {
          const NumRequests = await instance.methods.getNumRequests().call({ from: accounts[0] });

          const requests = await Promise.all(
            Array(parseInt(NumRequests))
              .fill()
              .map((delivery, index) => {
                return instance.methods.obtainRequests(index).call({ from: accounts[0] });
              })
          );
          this.setState({
            Docsrequests: requests
          })
        }

        this.setState({
          address: address,
          ipfsHash: hash,
          extIPFSHash: extHash,
          entidad: entidad
        });
        
        //console.log(this.state.ipfsHash)
        this.setState({ loadingPage: false })
      };

    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  renderDeliveryRows() {
    var deliveries;
    var externalDocs;

    externalDocs = false;
    deliveries = this.state.ipfsHash;

    return deliveries.map((delivery, index) => {
      return (
        <LlistatDocuments
          key={index}
          id={index}
          delivery={delivery}
          externalDocs={externalDocs}
        />
      );
    });
  };

  renderExternalRows() {
    var deliveries;
    var externalDocs;

    externalDocs = true;

    deliveries = this.state.extIPFSHash;

    return deliveries.map((delivery, index) => {
      return (
        <LlistatDocuments
          key={index}
          id={index}
          delivery={delivery}
          externalDocs={externalDocs}
        />
      );
    });
  };

  renderSolicituds() {
    var solicituds;

    solicituds = this.state.Docsrequests;

    return solicituds.map((delivery, index) => {
      if (solicituds[index] !== "0x0000000000000000000000000000000000000000") {
        return (
          <LlistatSolicituds
            key={index}
            id={index}
            sol_Addr_Bob={solicituds[index]}
          />
        );
      }

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
              &nbsp; Certificados recibidos &nbsp;
              <Icon name='file alternate outline icon' circular />
            </h3>
          </Divider>

          <Table fixed>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell style={{ width: 90, textAlign: "center" }}>#</Table.HeaderCell>
                <Table.HeaderCell style={{ width: 700 }}>Hash documento IPFS</Table.HeaderCell>
                <Table.HeaderCell style={{ width: 300 }}></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>{this.renderExternalRows()}</Table.Body>
          </Table>

        </div>)
          :
          (<div>

            <Divider horizontal>
              <h3 style={{ textAlign: "center" }}>
                <Icon name='file alternate outline icon' circular />
                &nbsp; Mis certificados &nbsp;
                <Icon name='file alternate outline icon' circular />
              </h3>
            </Divider>
            <Table fixed>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell style={{ width: 90, textAlign: "center" }}>#</Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 700 }}>Hash documento IPFS</Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 300 }}></Table.HeaderCell>
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
                <Input required
                  value={this.state.addressEnt}
                  onChange={event => this.setState({ addressEnt: event.target.value })}
                />
              </Form.Field>
              <Form.Field>
                <label style={{ fontSize: '15px' }}>Hash documento IPFS:</label>
                <Input required
                  value={this.state.docHash}
                  onChange={event => this.setState({ docHash: event.target.value })}
                />
              </Form.Field>

              <Message error header="Error" content={this.state.errorMessageAlta} />

              <Button color='blue' size='large' onClick={() => this.sendDoc} primary loading={this.state.loading}>
                Enviar documento
              </Button>
            </Form>  
            <Form>
              {this.state.externalDocs ? (<div>
                <Divider horizontal>
                  <h3 style={{ textAlign: "center" }}>
                    <Icon name='file alternate outline icon' circular />
                    &nbsp; Certificados externos &nbsp;
                    <Icon name='file alternate outline icon' circular />
                  </h3>
                </Divider>
                <Table fixed>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell style={{ width: 90, textAlign: "center" }}>#</Table.HeaderCell>
                      <Table.HeaderCell style={{ width: 700 }}>Hash documento IPFS</Table.HeaderCell>
                      <Table.HeaderCell style={{ width: 300 }}></Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>{this.renderExternalRows()}</Table.Body>
                </Table>
              </div>) : (<div>

              </div>)}
            </Form>

            <Divider horizontal clearing>
              <h3 style={{ textAlign: "center" }}>
                <Icon name='comment alternate outline icon' circular />
                &nbsp; Solicitudes &nbsp;
                <Icon name='comment alternate outline icon' circular />
              </h3>
            </Divider>
            <h3><Icon name="check icon" ></Icon> &nbsp; &nbsp; Solicitudes recibidas: </h3>
            <Table fixed>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell style={{ width: 90 }}>#</Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 300 }, { fontSize: '15px' }}>Dirección del usuario solicitante</Table.HeaderCell>
                  <Table.HeaderCell> Hash del documento a enviar</Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 100 }}> </Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 100 }}> </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body >{this.renderSolicituds()}</Table.Body>
            </Table>
          </div>
          )}

        <div>

          <h3><Icon name="question" style={{ marginTop: '20px' }}></Icon>&nbsp; &nbsp; Solicitar documentos: </h3>

          <Form onSubmit={this.requestDoc} error={!!this.state.errorMessageAlta}>
            <Form.Field>
              <label style={{ fontSize: '15px' }}>Dirección Ethereum del propietario del documento:</label>
              <Input required
                value={this.state.addressUsuExt} style={{ marginBottom: '20px' }}
                onChange={event => this.setState({ addressUsuExt: event.target.value })}
              />
            </Form.Field>
            <Button color='blue' style={{ marginBottom: '20px' }} size='large' onClick={() => this.requestDoc} primary loading={this.state.loading}>
              Enviar solicitud
            </Button>
          </Form>
        </div>
      </div>
    );
  }

}
export default User;