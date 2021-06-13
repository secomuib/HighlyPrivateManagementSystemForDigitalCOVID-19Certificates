import React, { Component } from 'react';
import {Form, Button, Grid, Message, Segment, Input, Dimmer, Divider,Icon, Loader, Table} from 'semantic-ui-react';
import lab from '../ethereum/lab';
import who from '../ethereum/who';
import web3 from '../ethereum/web3';
import axios from 'axios';
import user from '../ethereum/user';

const ipfsClient = require('ipfs-api');
const ipfs = ipfsClient({host:'ipfs.infura.io', port:5001, protocol: 'https'});


class Lab extends Component {

  constructor(props) {
    super(props)

    this.state = {
      prueba: 'vacuna',
      Nombre: '',
      apellidos: '',
      nacimiento:'',
      resultado:'',
      expedicion:'',
      validez:'',
      buffer: null,
      plaintext: [],
      EthAddress: '',
      ipfsHash: '',
      capsule:'',
      address: '',
      alice_PubKey: '',
      loading: false,
      loadingPage:true
    }
  
  }

  componentDidMount = async () => {
    try{
        /*const accounts = await web3.eth.getAccounts();
        const myStorage = window.localStorage;
        if(myStorage.getItem('claus laboratori ' + accounts) == null){
          axios.get('/keysCreation').then((response) =>{
            const {data} = (response);
            console.log('Data ' + data);
            
            myStorage.setItem('claus laboratori ' + accounts, JSON.stringify(data));
          });
        }*/
       
    }finally{
      this.setState({ loadingPage: false })
    }
  }

  /*captureFile = (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({buffer: Buffer(reader.result)});
    }
  }*/

  onSubmit = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });
    console.log("Submitting the form...");
    try {
        const accounts = await web3.eth.getAccounts();
        const address = await who.methods.getLabSC(accounts[0]).call();
        console.log(address);
        let lab_instance = lab(address);
        console.log('lab instance ' +lab_instance);
        //const owner = await lab_instance.methods.getOwner().call();
        //console.log('owner: ' + owner);

        //Consultem quina és l'adreça de l'SC de l'usuari al qual s'ha d'enviar el document
        console.log('Alice: '+this.state.EthAddress);
        const aliceSCAddress = await who.methods.userSC(this.state.EthAddress).call();
        console.log('Alice SC: ' + aliceSCAddress);

        let alice_instance = user(aliceSCAddress);
        //Obtenim la clau pública de l'usuari, per a poder realitzar l'encriptació
        const alice_PubKey = await alice_instance.methods.getPubKey().call();
        var stringAlicePubKey = alice_PubKey.toString()
        console.log(typeof(stringAlicePubKey));
        console.log(stringAlicePubKey)

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
        console.log('PlainText: ' + plaintext)
        
        //Codifiquem el certificat (JSON) a base64 per a poder enviar-lo al proxy per a realitzar l'encriptació
        let plaintext_Base64 = Buffer.from(plaintext).toString("base64")
        console.log(plaintext_Base64);
        this.setState({ plaintext: plaintext_Base64 })
        console.log("JSON: "+ this.state.plaintext);
        console.log(plaintext.nombre);

      //Solicitem l'encriptació al proxy
      await fetch('/encryption', {
        method: 'POST',
        body: JSON.stringify({
          clau: stringAlicePubKey,
          plaintext: this.state.plaintext}),
        headers:{
          'Content-type': 'application/json',
        }
      }).then(response => response.json()
      ).then(result=> {
        console.log('aliceSCAddress' + aliceSCAddress)
        //lab_instance.methods.carregaDocument(aliceSCAddress, hashDoc).send({from:accounts[0]});
        
        this.setState({
          ipfsHash: result.hash,
          capsule: result.capsule
        });

        console.log(result.capsule)
        console.log(result.hash)
      }).catch((e) => {console.log(e.message)})


      await lab_instance.methods.carregaDocument(aliceSCAddress, this.state.ipfsHash, this.state.capsule).send({from: accounts[0]});


        
        
        /*axios.get('/encryption', {
          params: {
            plaintext: 'Hola bon dia',
            clau: stringAlicePubKey
          }
        }).then((response) =>{
          console.log('Data encryption' + response);
        }).catch((error) => {console.log(error)});*/


        /*const res = await axios('/encryption', {plaintext: 'Hola bon dia', clau: 'Hola'}).then((response) =>{
          const {data} = (response);
          console.log('Data encryption' + data);
        });*/

        
          /*await ipfs.add(this.state.buffer, (error, result) => {
            console.log('ipfs result', result);
            const hashDoc = result[0].hash;
            console.log('hashDoc: ' + hashDoc);
            let lab_instance = lab(address);
            const carregaDoc = lab_instance.methods.carregaDocument(aliceSCAddress, hashDoc).send({from:accounts[0]});

            this.setState({
              ipfsHash: hashDoc,
            });

            if(error){
              console.error(error);
              return;
            }
          });*/
         
        
        // Refresh, using withRouter
        //this.props.history.push('/');
        //this.props.history.push('/Laboratorio');
    } catch (err) {
        this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false, 
          Nombre: '',
          apellidos: '',
          nacimiento:'',
          resultado:'',
          expedicion:'',
          validez:'',
          EthAddress: ''});
    }

  };
  
  /*datos() {
    var texto = [];
    texto.push('<?xml version="1.0" encoding="UTF-8" ?>\n');
    texto.push('<datos>\n');
    texto.push('\t<nombre>');
    texto.push(this.state.Nombre);
    texto.push('</nombre>\n');
    texto.push('\t<apellidos>');
    texto.push(this.state.apellidos);
    texto.push('</apellidos>\n');
    texto.push('\t<nacimiento>');
    texto.push(this.state.nacimiento);
    texto.push('</nacimiento>\n');
    texto.push('\t<prueba>');
    texto.push(this.state.prueba);
    texto.push('</prueba>\n');
    texto.push('\t<resultado>');
    texto.push(this.state.resultado);
    texto.push('</resultado>\n');
    texto.push('\t<fechaExpedicion>');
    texto.push(this.state.expedicion);
    texto.push('</fechaExpedicion>\n');
    texto.push('\t<periodoValidez>');
    texto.push(this.state.validez);
    texto.push('</periodoValidez>\n');
    texto.push('</datos>');

    var blob = new Blob(texto, {type: 'application/xml'})
    console.log(new Blob(texto, {type: 'application/xml'}))
    return blob;
  }*/

  /*crearArchivo = async event => {
    event.preventDefault;

    let xml = '<datos>\
      <prueba>' + {this.state.prueba} +'</prueba>\
      <nombre>'+{this.state.Nombre}+'</nombre>\
      <apellidos>Pericàs Gornals</apellidos>\
      <nacimiento>2021-05-13</nacimiento>\
      <fechaExpedicion>2021-05-11</fechaExpedicion>\
      <periodoValidez>2021-05-13</periodoValidez>\
      </datos>';


    //var dades = this.datos();
    //console.log(dades);
    //var reader = new FileReader();
    /*axios.get(XMLData,{
      "Content-Type": "application/xml; charset=utf-8"
    }).then((response) => {
      console.log('Your xml file as string' , response.getElementsByTagName( "nombre")[0].childNodes[0]);
    })*/
    /*var dades = this.datos();
    console.log(dades);
    var reader = new FileReader();
    reader.onload = function (event) {
        var save = document.createElement('a');
        save.href = event.target.result;
        save.target = '_blank';
        save.download = 'archivo.xml' || 'archivo.dat';
        var clicEvent = new MouseEvent('click', {
            'view': window,
                'bubbles': true,
                'cancelable': true
        });
        save.dispatchEvent(clicEvent);
        (window.URL || window.webkitURL).revokeObjectURL(save.href);*/
    //};
   /* reader.readAsArrayBuffer(new Blob([dades], {type: 'application/xml'}));
    reader.onloadend = () => {
      this.setState({buffer: Buffer(reader.result)});
    }
    this.onSubmit(event);
};*/

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
        <Grid columns={1} relaxed='very'>
          <Grid.Column>
            <Divider horizontal><h2 style={{ textAlign: "center"}}><Icon name='upload icon' circular />&nbsp; Nuevo certificado &nbsp;<Icon  name='upload icon' circular /></h2></Divider>

            {/* <h3>Añadir documento</h3> */}
            <Form>
              <Form.Field>
                <label style={{fontSize:'15px'}}>Introducir dirección Ethereum del propietario del documento:</label>
                  <Input
                    value={this.state.EthAddress} onChange={event => this.setState({ EthAddress: event.target.value })}
                />
              </Form.Field>
            </Form>
          </Grid.Column>
        </Grid>
        
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessageAlta}>
          <Form.Field>
            <div></div>
            <Grid columns={2} relaxed='very'>
          <Grid.Column>
            <label style={{fontSize:'15px'}} htmlFor="textNombre">Nombre: </label>
            <Input type="text" id="textNombre" value={this.state.Nombre}  onChange={event => this.setState({Nombre: event.target.value})}/>
            <label style={{fontSize:'15px'}} htmlFor="textApellidos">Apellidos: </label>
            <Input type="text" id="textApellidos" value={this.state.apellidos}  onChange={event => this.setState({apellidos: event.target.value})}/>
            <label style={{fontSize:'15px'}} htmlFor="textNacimiento">Fecha de nacimiento: </label>
            <Input type="date" id="textNacimiento" value={this.state.nacimiento} onChange={event => this.setState({nacimiento: event.target.value})}/>
            </Grid.Column>
            <Grid.Column>
            <label style={{fontSize:'15px'}}>Tipo de prueba: </label>
            <select value = {this.state.prueba} onChange={event => this.setState({prueba: event.target.value})}>
              <option defaultValue='Vacuna'>Vacuna</option>
              <option value='PCR'>PCR</option>
              <option value='Test de antígenos'>Test de antígenos</option>
            </select>
            <label style={{fontSize:'15px'}}>Resultado: </label>
            <Input type="text" value={this.state.resultado} onChange={event => this.setState({resultado: event.target.value})}/>
            <label style={{fontSize:'15px'}}>Fecha expedición: </label>
            <Input type="date" value={this.state.expedicion} onChange={event => this.setState({expedicion: event.target.value})}/>
            <label style={{fontSize:'15px'}}>Periodo validez: </label>
            <Input type="date" value={this.state.validez} onChange={event => this.setState({validez: event.target.value})}/>
            </Grid.Column>
            </Grid>
          </Form.Field>
        
          <Button color='blue' style={{ marginBottom: '20px' }} size = 'large' onClick={() => this.onSubmit} primary loading={this.state.loading}>
            Enviar documento
          </Button>

        </Form>

      </div>
    );
  }


}
export default Lab;





