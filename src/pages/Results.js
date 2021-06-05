import React, { Component, useState, useEffect } from 'react';
import {useParams} from 'react-router-dom';
import {Form, Button, Message, Segment, Input, Dimmer, Loader, Table} from 'semantic-ui-react';
import { parse } from 'fast-xml-parser';
import { isReturnStatement } from 'typescript';


const Results = (props) => {
  return(
    <div>
      <h2>Hola bon dia</h2>
      <h2>{this.props.nom}</h2>
      </div>
  )
}


/*class Results extends Component {
  state = {
    nombre: '', 
    apellidos: '', 
    nacimiento: '', 
    prueba: '', 
    resultado: '',
    expedicion:'',
    validez: '',
    loading: false,
    loadingPage: true
  };



  obtenerDatos = async () => {
    const {hash} = useParams();
    console.log('hash: ' + hash)
    fetch(`https://ipfs.infura.io/ipfs/${hash}` )
    .then((response) => response.text())
      .then((textResponse) => {
        console.log(textResponse);
        let obj = parse(textResponse);
        let nombre = obj.datos.nombre;
        let apellidos = obj.datos.apellidos;
        let nacimiento = obj.datos.nacimiento;
        let prueba = obj.datos.prueba;
        let resultado = obj.datos.resultado;
        let expedicion = obj.datos.expedicion;
        let validez = obj.datos.validez;
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
      })
      .catch((error) => {
          console.log(error);
      });
    const doc = await dades.json()
    console.log('Dades: ' + doc);
  }*/
  /*componentDidMount = async () => {
    try{
      this.obtenerDatos()
      /*fetch('https://ipfs.infura.io/ipfs/'/*+ props.delivery*//*)
      .then((response) => response.text())
      .then((textResponse) => {
        console.log(textResponse);
        let obj = parse(textResponse);
        let nombre = obj.datos.nombre;
        let apellidos = obj.datos.apellidos;
        let nacimiento = obj.datos.nacimiento;
        let prueba = obj.datos.prueba;
        let resultado = obj.datos.resultado;
        let expedicion = obj.datos.expedicion;
        let validez = obj.datos.validez;
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
      })
      .catch((error) => {
          console.log(error);
      });*/
    

    /*}finally{
      this.setState({ loadingPage: false })
    }
  }*/


  /*render() {
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
        <h3>Resultados</h3>
      </div>
    );
  }
}*/
export default Results;
