import React, { Component, useState, useEffect } from 'react';
import axios from 'axios';
import who from '../ethereum/who';
import web3 from '../ethereum/web3';
import {Icon, Form, Button, Message, Segment, Input, Divider, Grid, Dimmer, Loader, Table, GridColumn} from 'semantic-ui-react';
import DeliveryRow from '../components/DeliveryRow';
import LlistatSolicituds from '../components/LlistatSolicituds';

class Who extends Component {
  state = {
    labAlta: '',
    labBaja: '',
    lab_name: '',
    entidadAlta: '',
    entidadBaja: '',
    sc_lab:'',
    loading: false,
    errorMessageAlta: '',
    numLabs: '',
    ArrayLabs: [],
    Docsrequests: [],
    loadingPage: true
  };

  prova = async event =>{
    event.preventDefault();
    try{
      this.setState({ loading: true, errorMessageAlta: '' });
      
      console.log("Funcio time")
      axios.get('/keysCreation').then((response) =>{
        const {data} = (response);
        console.log('Data ' + data);
        
        const myStorage = window.localStorage;
        myStorage.setItem('claus alice', JSON.stringify(data));
      });
    }catch(err){
      this.setState({errorMessage:err.message});
    }finally {
      this.setState({ loading: false });
    }
  }

  //Funció per a donar d'alta un nou Laboratori
  altaLab = async event => {
    event.preventDefault();
    this.setState({ loading: true, errorMessageAlta: '' });

    try {
        const accounts = await web3.eth.getAccounts();
        await who.methods.registerLab(this.state.labAlta, this.state.lab_name).send({from: accounts[0]});

        const labsCount =  await who.methods.getLabsCount().call({from: accounts[0]});
        console.log(labsCount);

        //Refresc de la pàgina
        //window.location.reload();
    } catch (err) {
        this.setState({ errorMessageAlta: err.message });
    } finally {
        this.setState({ loading: false });
    }

  };

  //Funció per a donar de baixa un Laboratori actiu
  bajaLab = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
        const accounts = await web3.eth.getAccounts();

        const scAddr = await who.methods.getLabSC(this.state.labBaja).call({from: accounts[0]});

        await who.methods.deleteLab(this.state.labBaja, scAddr).send({from: accounts[0]});

        //Refresc de la pàgina
        //window.location.reload();

    } catch (err) {
        this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  //Funció per a donar d'alta una entitat fiable'
  altaEntidad = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
      console.log('altaEntidad');
        const accounts = await web3.eth.getAccounts();

        await who.methods.Entity(true, this.state.entidadAlta).send({from: accounts[0]});

        //Refresc de la pàgina
        //window.location.reload();

    } catch (err) {
        this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };
  
  //Funció per a donar de baixa una entitat fiable'
  bajaEntidad = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
      console.log('bajaEntidad');
        const accounts = await web3.eth.getAccounts();

        await who.methods.Entity(false, this.state.entidadBaja).send({from: accounts[0]});

        //Refresc de la pàgina
        window.location.reload();

    } catch (err) {
        this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  componentDidMount = async () => {
    try{
      const accounts =  await web3.eth.getAccounts();
      console.log("HOLA");
      const NumLaboratorios = await who.methods.getLabsCount().call({from: accounts[0]});
      console.log("Num laboratorios: "+ NumLaboratorios);
      console.log("TIPO NUM Laboratorios: " + typeof(parseInt(NumLaboratorios)));

      //const Laboratorio = await who.methods.Active_Labs((parseInt(NumLaboratorios)-1)).call();
      //console.log("Laboratorio: " + Laboratorio)

      const ArrayLabs = await Promise.all(
          Array(parseInt(NumLaboratorios))
              .fill()
              .map((delivery, index) => {
                  return who.methods.Active_Labs(index).call();
              })
      );
      console.log("ArrayLabs " + ArrayLabs);
    
      const statLabs = await Promise.all(
        Array(parseInt(NumLaboratorios))
            .fill()
            .map((delivery, index) => {
              return who.methods.getLabState(ArrayLabs[index]).call({from: accounts[0]});
            })
      );
            console.log("State Labs:" + statLabs);
            //console.log("Estado: " + await who.methods.getLabState(ArrayLabs[1]).call({from: accounts[0]}));
          
      

      const ArrayNames = await Promise.all(
        Array(parseInt(NumLaboratorios))
            .fill()
            .map((delivery, index) => {
                const address = ArrayLabs[index];
                return who.methods.getLabName(address).call({from: accounts[0]});
            })
      );
      const NumRequests = await who.methods.getNumRequests().call({from: accounts[0]});

      const requests = await Promise.all(
        Array(parseInt(NumRequests))
            .fill()
            .map((delivery, index) => {
              return who.methods.obtainRequests(index).call({from: accounts[0]});
            })
      );

      console.log('Requests ');
      console.log(requests);

      this.setState({
          ArrayLabs: ArrayLabs,
          labName: ArrayNames, 
          StateLabs: statLabs, 
          Docsrequests: requests
      });




    }finally{
      this.setState({ loadingPage: false })
    }
  }

  renderDeliveryRows(){
      var deliveries;
      var labName;
      var StateLabs;


      deliveries = this.state.ArrayLabs;
      console.log("TIPO: "+ deliveries);
      labName = this.state.labName;
      StateLabs = this.state.StateLabs;

      return deliveries.map((delivery, index) => {
        return (
            <DeliveryRow
                key={index}
                id={index}
                delivery={delivery}
                name = {labName[index]}
                estado = {StateLabs[index].toString()}
            />
        );
      });   
  };

  renderSolicituds(){
    var solicituds;

    solicituds = this.state.Docsrequests;
    console.log("Solicituds "+ solicituds);

    return solicituds.map((delivery, index) => {
      console.log(solicituds[index][0]);
      console.log(solicituds[index][1]);
        if(solicituds[index][0] !=="0x0000000000000000000000000000000000000000" || 
            solicituds[index][0] !=="0x0000000000000000000000000000000000000000"){
            return (
              <LlistatSolicituds
                  key={index}
                  id={index}
                  sol_Addr_Alice={solicituds[index][0]}
                  sol_Addr_Bob={solicituds[index][1]}
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
        <Divider horizontal><h2 style={{ textAlign: "center"}}><Icon name='syringe icon' circular />&nbsp; LABORATORIOS &nbsp;<Icon  name='syringe icon' circular /></h2></Divider>
        
        <Grid columns={2} relaxed='very'>
          <Grid.Column>
        <h3><Icon name="angle double up icon"></Icon>Alta laboratorios</h3>

        {/*<Form onSubmit={this.prova} error={!!this.state.errorMessageAlta}>
        <Button color='blue' size = 'large' onClick={() => this.prova} enable loading={this.state.loading}>
            Prova
          </Button>
    </Form>*/}

        <Form onSubmit={this.altaLab} error={!!this.state.errorMessageAlta}>
          <Form.Field>
          <label style={{fontSize:'15px'}}>Nombre del laboratorio</label>
            <Input
              value={this.state.lab_name}
              onChange={event => this.setState({ lab_name: event.target.value })}
            />
          </Form.Field>

            <Form.Field>
            <label style={{fontSize:'15px'}}>Cuenta Ethereum del laboratorio</label>
            <Input
              value={this.state.labAlta}
              onChange={event => this.setState({ labAlta: event.target.value })}
            />
          </Form.Field>
          <Message error header = "Error" content={this.state.errorMessageAlta}/>

          <Button color='green' style={{ marginBottom: '15px' }} size = 'large' onClick={() => this.altaLab} enable loading={this.state.loading}>
            Activar laboratorio
          </Button>
          </Form>
          </Grid.Column>
          <Grid.Column>
          <h3><Icon name="angle double down icon"></Icon>Baja laboratorios</h3>
          <Form onSubmit={this.bajaLab} error={!!this.state.errorMessageAlta}>

          <Form.Field>
            <label style={{fontSize:'15px'}}>Cuenta Ethereum del laboratorio</label>
            <Input
              value={this.state.labBaja}
              onChange={event => this.setState({labBaja: event.target.value })}
            />
          </Form.Field>

          <Button color='red' style={{ marginTop: '75px' }} size = 'large' onClick={() => this.bajaLab} enable loading={this.state.loading}>
            Desactivar laboratorio
          </Button>
        </Form>
        </Grid.Column>
        </Grid>
        <h3><Icon name="check icon" ></Icon>Laboratorios activos: </h3>
              <Table fixed>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell style={{ width: 90}}>#</Table.HeaderCell>
                            <Table.HeaderCell style={{textAlign: "center" }, {fontSize:'15px'}}>Dirección del laboratorio</Table.HeaderCell>
                            <Table.HeaderCell style={{width: 500, textAlign: "center"}, {fontSize:'15px'}}>Nombre laboratorio</Table.HeaderCell>
                            <Table.HeaderCell style={{width: 500, textAlign: "center"}, {fontSize:'15px'}}>Estado del laboratorio</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body >{this.renderDeliveryRows()}</Table.Body>
                </Table>

        <Divider horizontal><h2 style={{ textAlign: "center"}}><Icon name='briefcase icon' circular />&nbsp;ENTIDADES &nbsp;<Icon name='briefcase icon' circular /></h2></Divider>
        <Grid columns={2} relaxed='very'>
          <Grid.Column>
        <h3><Icon name="angle double up icon"></Icon>Alta entidad: </h3>
          <Form onSubmit={this.altaEntidad} error={!!this.state.errorMessageAlta}>
            <Form.Field>
              <label>Cuenta Ethereum de la entidad</label>
              <Input
                value={this.state.entidadAlta}
                onChange={event => this.setState({ entidadAlta: event.target.value })}
              />
            </Form.Field>

            <Message error header = "Error" content={this.state.errorMessageAlta}/>

            <Button color='green' style={{ marginBottom: '10px' }} size = 'large' onClick={() => this.altaEntidad} enable loading={this.state.loading}>
              Habilitar entidad
            </Button>
          </Form>
          </Grid.Column>


          <Grid.Column>
        <h3><Icon name="angle double down icon" ></Icon>Baja entidad: </h3>
          <Form onSubmit={this.bajaEntidad} error={!!this.state.errorMessageAlta}>
            <Form.Field>
              <label>Cuenta Ethereum de la entidad</label>
              <Input
                value={this.state.entidadBaja}
                onChange={event => this.setState({ entidadBaja: event.target.value })}
              />
            </Form.Field>
            <Message error header = "Error" content={this.state.errorMessageAlta}/>

            <Button color='red' style={{ marginBottom: '20px' }} size = 'large' onClick={() => this.bajaEntidad} enable loading={this.state.loading}>
              Deshabilitar entidad
            </Button>
          </Form>
          </Grid.Column>
        </Grid>
        <h3><Icon name="check icon" ></Icon>Solicitud de documentos: </h3>
              <Table fixed>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell style={{ width: 90}}>#</Table.HeaderCell>
                            <Table.HeaderCell style={{width: 300}, {fontSize:'15px'}}>Dirección del usuario solicitante</Table.HeaderCell>
                            <Table.HeaderCell style={{ width: 300}, {fontSize:'15px'}}>Dirección del usuario </Table.HeaderCell>
                            <Table.HeaderCell style={{ width: 90}}> </Table.HeaderCell>
                            <Table.HeaderCell style={{ width: 90}}> </Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body >{this.renderSolicituds()}</Table.Body>
                </Table>
          <h1></h1>      
      </div>
    );
  }
}
export default Who;





