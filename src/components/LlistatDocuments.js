import React, { Component } from 'react';
import { Table, Button, Icon } from 'semantic-ui-react';
import Swal from 'sweetalert2';
import who from '../ethereum/who';
import web3 from '../ethereum/web3';
import user from '../ethereum/user';
import '../pages/estils.css';

class LlistatDocuments extends Component {

  constructor(props) {
    super(props)
    this.state = {
      delivery: '',
      nombre: '',
      apellidos: '',
      nacimiento: '',
      prueba: '',
      resultado: '',
      result: [],
      expedicion: '',
      validez: '',
      entitat: '',
      bob_capsule: '',
      bob_cfrags: '',
      loading: false,
      errorMessage: '',
      view: false
    };
  }


  componentDidMount = async () => {
    try {
      //const entitat = this.props.entitat;
      this.setState({
        entitat: this.props.entitat
      });
      console.log(this.state.entitat);
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  onView = async () => {
    try {

      this.setState({
        loading: true,
        errorMessageAlta: '',
        view: true
      });
      const accounts = await web3.eth.getAccounts();
      var address = await who.methods.userSC(accounts[0]).call();
      var instance = await user(address);

      if (this.props.externalDocs == false) {
        const docInfo = await instance.methods.getDocsInfo(this.props.id).call({ from: accounts[0] });
        const capsule = docInfo[1];
        const myStorage = window.localStorage;

        await fetch('/decryption', {
          method: 'POST',
          body: JSON.stringify({
            capsule: capsule,
            private_key: myStorage.getItem('clau privada usuari ' + accounts),
            public_key: myStorage.getItem('clau publica usuari ' + accounts),
            hashipfs: this.props.delivery
          }),
          headers: {
            'Content-type': 'application/json',
          }
        }).then((response) => {
          return response.json()
        }).then(result => {
          this.setState({
            nombre: result.nombre,
            apellidos: result.apellidos,
            nacimiento: result.nacimiento,
            prueba: result.prueba,
            resultado: result.resultado,
            expedicion: result.fechaExpedicion,
            validez: result.periodoValidez
          });

          this.verDocumento()
        })

      } else {
        const hashIPFS = await instance.methods.getExtDocs(this.props.id).call({ from: accounts[0] });

        const extInfo = await instance.methods.getExtInfo(hashIPFS).call({ from: accounts[0] });
        const alices_public_key = extInfo[0];
        const capsule = extInfo[1];
        const kfrags0 = extInfo[2];
        const alices_verifying_key = extInfo[3];

        const myStorage = window.localStorage;

        await fetch('/ursulas', {
          method: 'POST',
          body: JSON.stringify({
            capsule: capsule,
            kfrags: kfrags0,
            alices_public_key: alices_public_key,
            alices_verifying_key: alices_verifying_key,
            bobs_public_key: myStorage.getItem('clau publica usuari ' + accounts),
            bobs_private_key: myStorage.getItem('clau privada usuari ' + accounts),
            hashipfs: hashIPFS
          }),
          headers: {
            'Content-type': 'application/json',
          }
        }).then((response) => {
          return response.json()
        }).then(result => {
          this.setState({
            nombre: result.nombre,
            apellidos: result.apellidos,
            nacimiento: result.nacimiento,
            prueba: result.prueba,
            resultado: result.resultado,
            expedicion: result.fechaExpedicion,
            validez: result.periodoValidez
          });

          this.verDocumento()

        }).catch((e) => { console.log(e.message) })

      }
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  verDocumento() {
    if ((this.state.prueba === "Test de antígenos"
      || this.state.prueba === "PCR") && (this.state.resultado === "Positivo" || this.state.resultado === "positivo")) {
      var color = '#FFA4A8'
    } else {
      var color = '#AEFFA4'
    }

    Swal.fire({
      title: 'Los resultados obtenidos son: ',
      html:
        '<p class="text"> <strong>Nombre: </strong>' + this.state.nombre +
        '<br/> <strong>Apellidos: </strong>' + this.state.apellidos +
        '<br/> <strong>Fecha de nacimiento: </strong>' + this.state.nacimiento +
        '<br/> <strong>Prueba realizada: </strong>' + this.state.prueba +
        '<br/> <strong>Fecha de expedición: </strong>' + this.state.expedicion +
        '<br/> <strong>Resultado: </strong>' + this.state.resultado +
        '<br/> <strong>Periodo de validez: </strong>' + this.state.validez + '</p>',
      customClass: 'swal-text',
      background: color,
      showCloseButton: true,
      confirmButtonText: 'Aceptar',
      width: 400,
      padding: '3em',
      backdrop: `
        left top
        no-repeat
        rgba(243, 229, 225, 0.8)
      `
    }).then((result) => {
      if (result.isConfirmed) {

      }
    }).catch((e) => { console.log(e.message) })
  }

  render() {
    return (
      <Table.Row>
        <Table.Cell style={{ width: 90, textAlign: "center" }}>{this.props.id + 1}</Table.Cell>
        <Table.Cell style={{ width: 700 }}>{this.props.delivery}</Table.Cell>
        <Table.Cell style={{ width: 300 }}>

          <Button animated='vertical' color='blue' onClick={this.onView} primary loading={this.state.loading}>
            <Button.Content hidden>View</Button.Content>
            <Button.Content visible>
              <Icon name='eye' />
            </Button.Content>
          </Button>

        </Table.Cell>
      </Table.Row>
    );
  }
}

export default LlistatDocuments;