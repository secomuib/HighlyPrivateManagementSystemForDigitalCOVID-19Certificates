import React, { Component, useState } from 'react';
import { Link, Route, useHistory} from "react-router-dom";
import { Table, Button, Icon, Divider, Message, Form, Input } from 'semantic-ui-react';
import { parse } from 'fast-xml-parser';
import Results from '../pages/Results';
import Swal from 'sweetalert2';
import who from '../ethereum/who';
import web3 from '../ethereum/web3';
import user from '../ethereum/user';
import { convertToObject } from 'typescript';
import '../pages/estils.css';
import SendDoc from '../components/SendDoc';

class LlistatSolicituds extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      delivery: '',
      usuariAccept: false,
      Addr_bob: '',
      hashDoc:'',
      loading: false,
      errorMessage: '',
      view: false
    };
  }

  accept = async () => {
    try{
      this.setState({ loading: true, errorMessageAlta: '' });
      
      const accounts = await web3.eth.getAccounts();
      await who.methods.resolveAliceDocs(this.props.id).send({from:accounts[0]});
    }catch(err){
      this.setState({errorMessage:err.message});
    }finally {
      this.setState({ loading: false });
    }
  }

  deny = async () => {
    try{
      this.setState({ loading: true, errorMessageAlta: '' });

      const accounts = await web3.eth.getAccounts();
      await who.methods.denySol(this.props.id).send({from:accounts[0]});
    }catch(err){
      this.setState({errorMessage:err.message});
    }finally {
      this.setState({ loading: false });
      //this.props.history.push('/');
      //this.props.history.push('/Usuario');
    }
  }

  acceptUsuari = async () => {
    
  try{
      this.setState({ loading: true, errorMessageAlta: '' });

      var bobAddr;

      bobAddr = this.props.sol_Addr_Bob;
      console.log("bob addr prova ");
      console.log(bobAddr);
      console.log(this.state.hashDoc);

      const accounts = await web3.eth.getAccounts();
      console.log("accounts");
      const scAddr = await who.methods.getUserSC(bobAddr).call({from: accounts[0]});
      console.log('scAddr ' + scAddr);

      let entityInstance = user(scAddr);

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
      }).catch((e) => {console.log(e.message)})

      var address = await who.methods.userSC(accounts[0]).call();
      const instance = await user(address);
      console.log('Hash: ' + this.state.hashDoc);
      const index = await instance.methods.getIndexDoc(this.state.hashDoc).call({from: accounts[0]});
      console.log('Index: ' + index);
      const capsule = await instance.methods.getDocsCapsule(index).call({from: accounts[0]});
      console.log('capsule '+ capsule);
      const pubKeyUser =  await instance.methods.getPubKey().call();
      console.log('pubKeyUser ' + pubKeyUser);
      console.log('docHas: ' + this.state.hashDoc);
      entityInstance.methods.newExtDoc(this.state.hashDoc, pubKeyUser, capsule, this.state.kfrags0, this.state.alices_verifying_key).send({ from: accounts[0] });
      console.log('kfrags[0] ' + this.state.kfrags0)


      //Donem la solicitud per resolta
      await instance.methods.resolveSol(this.props.id).send({from:accounts[0]});

    }catch(err){
      this.setState({errorMessage:err.message});
    }finally {
      this.setState({ loading: false });
      this.props.history.push('/');
      this.props.history.push('/Usuario');
    }
  }

  denyUsuari = async () => {
    try{
      this.setState({ loading: true, errorMessageAlta: '' });

      const accounts = await web3.eth.getAccounts();
     
      const scAddr = await who.methods.getUserSC(accounts[0]).call({from: accounts[0]});
      console.log('scAddr ' + scAddr);

      let scUser = user(scAddr);
      await scUser.methods.resolveSol(this.props.id).send({from:accounts[0]});
    }catch(err){
      this.setState({errorMessage:err.message});
    }finally {
      this.setState({ loading: false });
      //this.props.history.push('/');
      //this.props.history.push('/Usuario');
    }
  }


  render() {
    if(this.props.sol_Addr_Alice){
        return (
         
            <Table.Row>            
                <Table.Cell style={{ width: 90}}>{this.props.id}</Table.Cell>
                <Table.Cell style={{ width: 300, textAlign: "center"}}>{this.props.sol_Addr_Bob}</Table.Cell>
                <Table.Cell style={{ width:300, textAlign: "center"}}>{this.props.sol_Addr_Alice}</Table.Cell>
                <Table.Cell style={{ width: 90, textAlign: "center"}}>
                    
                      <Button  color='blue' onClick={this.accept} primary loading={this.state.loading}>
                        <Button.Content>
                          <Icon name='check' />
                        </Button.Content>
                      </Button>
                      
                </Table.Cell>
                <Table.Cell style={{ width: 90, textAlign: "center"}}>
                    <Button color='blue' onClick={this.deny} primary loading={this.state.loading}>
                        <Button.Content>
                            <Icon name='times'/>
                        </Button.Content>
                    </Button>
                </Table.Cell>
            </Table.Row>
        );  
    }else{
        return(
            <Table.Row>            
                <Table.Cell style={{ width: 90}}>{this.props.id}</Table.Cell>
                <Table.Cell style={{ width: 300}}>{this.props.sol_Addr_Bob}</Table.Cell>
                <Table.Cell style={{ width: 500}}>
                    <Input value={this.state.hashDoc}
                            onChange={event => this.setState({ hashDoc: event.target.value })}
                            style={{width: "350px"}}
                            />
                </Table.Cell>

                <Table.Cell style={ {textAlign: "center"}}>
                    
                      <Button  color='blue' onClick={() => this.acceptUsuari()} primary loading={this.state.loading}>
                        <Button.Content>
                          <Icon name='check' />
                        </Button.Content>
                      </Button>
                      
                </Table.Cell>
                <Table.Cell style={ { textAlign: "center"}}>
                    <Button color='blue' onClick={this.denyUsuari} primary loading={this.state.loading}>
                        <Button.Content>
                            <Icon name='times'/>
                        </Button.Content>
                    </Button>
                </Table.Cell>
            </Table.Row>
        )
    }
    
    }
}

export default LlistatSolicituds;