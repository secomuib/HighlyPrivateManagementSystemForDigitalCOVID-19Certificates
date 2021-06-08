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

class SendDoc extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      errorMessage: '',
      view: false
    };

    console.log("sendDoc")
  }
  componentDidMount = async () => {
    console.log("SendDoc")
  }

  render() {
      console.log("SendDoc")
        return (

            <Form onSubmit={this.sendDoc} error={!!this.state.errorMessageAlta}>

              <Form.Field>
                <label style={{ fontSize: '15px' }}>Dirección Ethereum entidad:</label>
                <p>{this.props.bobAddr}</p>
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
          </Form>
        );  
   
    
    }
}

export default SendDoc;