import React, { Component, useState } from 'react';
import { Link, Route, useHistory} from "react-router-dom";
import { Table, Button, Icon, Divider, Message } from 'semantic-ui-react';
import { parse } from 'fast-xml-parser';
import Results from '../pages/Results';
import Swal from 'sweetalert2';
import who from '../ethereum/who';
import web3 from '../ethereum/web3';
import user from '../ethereum/user';
import { convertToObject } from 'typescript';
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
      expedicion:'',
      validez: '',
      entitat: '',
      bob_capsule: '',
      bob_cfrags:'',
      loading: false,
      errorMessage: '',
      view: false
    };
  }


  componentDidMount = async () => {
    const entitat = this.props.entitat;//({entitat}) => <h1>{entitat}</h1>
    console.log('Entitat component: '+entitat)
    this.setState({
      entitat: this.props.entitat
    });
    console.log(this.state.entitat);
  }

 onView = async () => {
  console.log(this.props.id)

  this.setState({
    view: true
  });


  const accounts = await web3.eth.getAccounts();
  var address = await who.methods.userSC(accounts[0]).call();
  var instance = await user(address);
  console.log('hola')
  console.log(this.state.entitat);

  if(this.props.entitat == false){
    const capsule = await  instance.methods.getDocsCapsule(this.props.id).call({from: accounts[0]});
    console.log('Capsule: '+ capsule);
    
    const myStorage = window.localStorage;
    
    await fetch('/decryption', {
      method: 'POST',
      body: JSON.stringify({
        capsule: capsule,
        private_key: myStorage.getItem('clau privada usuari ' + accounts),
        public_key: myStorage.getItem('clau publica usuari ' + accounts),
        hashipfs: this.props.delivery  
      }),
      headers:{
        'Content-type': 'application/json',
      }
    }).then(response => response.json()
    ).then(result=> {
        console.log(result)
        console.log(typeof(result))
      this.setState({
        nombre: result.cleartext.nombre,
        apellidos: result.cleartext.apellidos, 
        nacimiento: result.cleartext.nacimiento,
        prueba: result.cleartext.prueba, 
        resultado: result.cleartext.resultado,
        expedicion:result.cleartext.fechaExpedicion,
        validez: result.cleartext.periodoValidez
      });
      this.verDocumento()
    })

  }else{
    const hashIPFS = await instance.methods.getExtDocs(this.props.id).call();
    console.log('Hash external doc: '+hashIPFS);

    const extInfo = await instance.methods.getExtInfo(hashIPFS).call({from: accounts[0]});
    console.log('extInfo: ' +extInfo)
    const alices_public_key = extInfo[0];
    console.log('alices_public_key: ' +alices_public_key);
    const capsule = extInfo[1];
    console.log('capsule: ' + capsule);
    const kfrags0 = extInfo[2];
    console.log('kfrags0: ' + kfrags0);
    const alices_verifying_key = extInfo[3];
    console.log('alices_verifying_key: ' + alices_verifying_key);

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
      headers:{
        'Content-type': 'application/json',
      }
    }).then(response => response.json()
    ).then(result=> {
      console.log('Result cfrags' + result.cfrags)
      console.log('Result capsule' + result.capsule)
      
      this.setState({
        bob_capsule: result.capsule,
        bob_cfrags: result.cfrags
      })

      //console.log('aliceSCAddress' + aliceSCAddress)
      //lab_instance.methods.carregaDocument(aliceSCAddress, result.hash, result.capsule).send({from: accounts[0]});
      //lab_instance.methods.carregaDocument(aliceSCAddress, hashDoc).send({from:accounts[0]});
      //console.log(result.capsule)
      //console.log(result.hash)
    })
    console.log("prova cfrags: " + this.state.cfrags);

    /*await fetch('/decryption', {
      method: 'POST',
      body: JSON.stringify({
        capsule: this.state.bob_capsule,
        cfrags: this.state.bob_cfrags,
        private_key: myStorage.getItem('clau privada usuari ' + accounts),
        public_key: myStorage.getItem('clau publica usuari ' + accounts),
        hashipfs: hashIPFS  
      }),
      headers:{
        'Content-type': 'application/json',
      }
    }).then(response => response.json()
    ).then(result=> {
      console.log(result)
      console.log('Result ' + result.cleartext)
      console.log('Nom ' + result.cleartext.nombre)
  
      //console.log('aliceSCAddress' + aliceSCAddress)
      //lab_instance.methods.carregaDocument(aliceSCAddress, result.hash, result.capsule).send({from: accounts[0]});
      //lab_instance.methods.carregaDocument(aliceSCAddress, hashDoc).send({from:accounts[0]});
      //console.log(result.capsule)
      //console.log(result.hash)
    })*/
  }
  
}

verDocumento(){
  if((this.state.prueba === "Test de antígenos" 
  || this.state.prueba === "pcr") && this.state.resultado === "Positivo"){
    var color = '#FFA4A8'
  }else{
    var color = '#AEFFA4'
  }

  Swal.fire({
      title: 'Los resultados obtenidos son: ',
      html: 
        '<p class="text"> <strong>Nombre: </strong>' + this.state.nombre + 
        '<br/> <strong>Apellidos: </strong>'+ this.state.apellidos + 
        '<br/> <strong>Fecha de nacimiento: </strong>' + this.state.nacimiento +
        '<br/> <strong>Prueba realizada: </strong>' + this.state.prueba +
        '<br/> <strong>Fecha de expedición: </strong>' + this.state.expedicion +
        '<br/> <strong>Resultado: </strong>' + this.state.resultado +
        '<br/> <strong>Periodo de validez: </strong>' + this.state.validez +'</p>',
      customClass:'swal-text',
      background:color,
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
    if(result.isConfirmed){
      
    }
  })
}
  /*
  fetch('https://ipfs.infura.io/ipfs/' + this.props.delivery)
  .then((response) => response.text())
  .then((textResponse) => {
    let obj = parse(textResponse);
    let nombre = obj.datos.nombre;
    let apellidos = obj.datos.apellidos;
    let nacimiento = obj.datos.nacimiento;
    let prueba = obj.datos.prueba;
    let resultado = obj.datos.resultado;
    let expedicion = obj.datos.fechaExpedicion;
    let validez = obj.datos.periodoValidez;
    this.setState({
      nombre: nombre, 
      apellidos: apellidos, 
      nacimiento: nacimiento, 
      prueba: prueba, 
      resultado: resultado,
      expedicion:expedicion,
      validez: validez
    });
    
  
    console.log(this.state.nombre, this.state.apellidos);

    Swal.fire({
      title: 'Los resultados obtenidos son: ',
      html: '<strong>Nombre: </strong>' + this.state.nombre + 
        '<br/> <strong>Apellidos: </strong>'+ this.state.apellidos + 
        '<br/> <strong>Fecha de nacimiento: </strong>' + this.state.nacimiento +
        '<br/> <strong>Prueba realizada: </strong>' + this.state.prueba +
        '<br/> <strong>Fecha de expedición: </strong>' + this.state.expedicion +
        '<br/> <strong>Resultado: </strong>' + this.state.resultado +
        '<br/> <strong>Periodo de validez: </strong>' + this.state.validez +'',
      showCloseButton: true,
      confirmButtonText: 'Aceptar',
      width: 600,
      padding: '3em',
      backdrop: `
        left top
        no-repeat
      `
  }).then((result) => {
    if(result.isConfirmed){
      
    }
  })*/
    /*return(<Link to={`/Usuario/${this.props.delivery}`}>
    <Results nombre = {this.state.nombre}/>
    </Link>
    )*/    
    /*
  })
  .catch((error) => {
      console.log(error);
  });

  return null;
  };*/

  /*openDoc = async () => {
    this.onView();
    <Results nombre = {this.state.nombre}/>
  }*/


  /*
  <Table.Row>
                      <Table.HeaderCell style={{ width: 90 }}>#</Table.HeaderCell>
                      <Table.HeaderCell style={{ width: 300, textAlign: "center" }}>Hash documento IPFS</Table.HeaderCell>
                      <Table.HeaderCell style={{ width: 300 }}></Table.HeaderCell>
                    </Table.Row>
  */

  render() {
     return (
          <Table.Row>            
              <Table.Cell style={{ width: 90, textAlign: "center"}}>{this.props.id+1}</Table.Cell>
              <Table.Cell style={{ width: 700}}>{this.props.delivery}</Table.Cell>
              <Table.Cell style={{width:300}}>
                  
                    <Button animated='vertical' color='blue' onClick={this.onView}>
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