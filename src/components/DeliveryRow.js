import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { Table, Button, Icon, Message } from 'semantic-ui-react';


class DeliveryRow extends Component {
  state = {
    loading: false,
    errorMessage: '',
  };

  
  render() {
      return (
          <Table.Row>
              <Table.Cell style={{ width: 90}}>{this.props.id+1}</Table.Cell>
              <Table.Cell style={{ textAlign: "center"}}>{this.props.delivery}</Table.Cell>
              <Table.Cell style={{ width: 500}}>{this.props.name}</Table.Cell>
              <Table.Cell style={{ width: 500}}>{this.props.estado}</Table.Cell>
          </Table.Row>
      );

    }
}

export default DeliveryRow;
