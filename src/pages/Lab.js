import React, { Component } from 'react';
import { Form, Button, Grid, Segment, Input, Dimmer, Divider, Icon, Loader } from 'semantic-ui-react';
import lab from '../ethereum/lab';
import who from '../ethereum/who';
import web3 from '../ethereum/web3';
import user from '../ethereum/user';

class Lab extends Component {

  constructor(props) {
    super(props)

    this.state = {
      prueba: 'vacuna',
      Nombre: '',
      apellidos: '',
      nacimiento: '',
      resultado: '',
      expedicion: '',
      validez: '',
      buffer: null,
      plaintext: [],
      EthAddress: '',
      ipfsHash: '',
      capsule: '',
      address: '',
      alice_PubKey: '',
      loading: false,
      loadingPage: true
    }

  }

  componentDidMount = async () => {
    try {

    } finally {
      this.setState({ loadingPage: false })
    }
  }

  onSubmit = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
      const accounts = await web3.eth.getAccounts();
      var address = await who.methods.getLabSC(accounts[0]).call();
      let lab_instance = lab(address);

      //Consultem quina és l'adreça de l'SC de l'usuari al qual s'ha d'enviar el document
      const aliceSCAddress = await who.methods.userSC(this.state.EthAddress).call();

      let alice_instance = user(aliceSCAddress);
      //Obtenim la clau pública de l'usuari, per a poder realitzar l'encriptació
      const alice_PubKey = await alice_instance.methods.getPubKey().call();
      var stringAlicePubKey = alice_PubKey.toString()

      //Generem un JSON de les dades que formaràn el certificat
      let plaintext = JSON.stringify({
        nombre: this.state.Nombre,
        apellidos: this.state.apellidos,
        prueba: this.state.prueba,
        resultado: this.state.resultado,
        nacimiento: this.state.nacimiento,
        fechaExpedicion: this.state.expedicion,
        periodoValidez: this.state.validez
      });
      //Codifiquem el certificat (JSON) a base64 per a poder enviar-lo al proxy per a realitzar l'encriptació
      let plaintext_Base64 = Buffer.from(plaintext).toString("base64")
      this.setState({ plaintext: plaintext_Base64 })

      //Solicitem l'encriptació al proxy
      await fetch('/encryption', {
        method: 'POST',
        body: JSON.stringify({
          clau: stringAlicePubKey,
          plaintext: this.state.plaintext
        }),
        headers: {
          'Content-type': 'application/json',
        }
      }).then(response => response.json()
      ).then(result => {
        this.setState({
          ipfsHash: result.hash,
          capsule: result.capsule
        });

      }).catch((e) => { console.log(e.message) })


      await lab_instance.methods.carregaDocument(aliceSCAddress, this.state.ipfsHash, this.state.capsule).send({ from: accounts[0] });

    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({
        loading: false,
        Nombre: '',
        apellidos: '',
        nacimiento: '',
        resultado: '',
        expedicion: '',
        validez: '',
        EthAddress: ''
      });
    }

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
      
            <Divider horizontal><h2 style={{ textAlign: "center" }}><Icon name='upload icon' circular />&nbsp; Nuevo certificado &nbsp;<Icon name='upload icon' circular /></h2></Divider>

        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessageAlta}>
          <Form.Field>
            <div></div>
            <Grid columns={2} relaxed='very'>
              <Grid.Column>
              <label style={{ fontSize: '15px' }}>Introducir dirección Ethereum del propietario del documento:</label>
                <Input required type="text" id="direccionEth" value={this.state.EthAddress} onChange={event => this.setState({ EthAddress: event.target.value })}/>
                <label style={{ fontSize: '15px' }} htmlFor="textNombre">Nombre: </label>
                <Input required type="text" id="textNombre" value={this.state.Nombre} onChange={event => this.setState({ Nombre: event.target.value })} />
                <label style={{ fontSize: '15px' }} htmlFor="textApellidos">Apellidos: </label>
                <Input required type="text" id="textApellidos" value={this.state.apellidos} onChange={event => this.setState({ apellidos: event.target.value })} />
                <label style={{ fontSize: '15px' }} htmlFor="textNacimiento">Fecha de nacimiento: </label>
                <Input required type="date" id="textNacimiento" value={this.state.nacimiento} onChange={event => this.setState({ nacimiento: event.target.value })} />
              </Grid.Column>
              <Grid.Column>
                <label style={{ fontSize: '15px' }}>Tipo de prueba: </label>
                <select value={this.state.prueba} onChange={event => this.setState({ prueba: event.target.value })}>
                  <option defaultValue='Vacuna'>Vacuna</option>
                  <option value='PCR'>PCR</option>
                  <option value='Test de antígenos'>Test de antígenos</option>
                </select>
                <label style={{ fontSize: '15px' }}>Resultado: </label>
                <Input type="text" value={this.state.resultado} onChange={event => this.setState({ resultado: event.target.value })} />
                <label style={{ fontSize: '15px' }}>Fecha expedición: </label>
                <Input required type="date" value={this.state.expedicion} onChange={event => this.setState({ expedicion: event.target.value })} />
                <label style={{ fontSize: '15px' }}>Periodo validez: </label>
                <Input required type="date" value={this.state.validez} onChange={event => this.setState({ validez: event.target.value })} />
              </Grid.Column>
            </Grid>
          </Form.Field>

          <Button color='blue' style={{ marginBottom: '20px' }} size='large' onClick={() => this.onSubmit} primary loading={this.state.loading}>
            Enviar documento
          </Button>
        </Form>

      </div>
    );
  }
}
export default Lab;





