import React from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export default () => {

    return (
        <Menu tabular stackable style={{ marginTop: '20px' }}>
            <Menu.Item as = {Link} to = '/'>
                Gestionar laboratorio
            </Menu.Item>
            <Menu.Item as = {Link} to = '/Laboratorio'>
                Laboratorio
            </Menu.Item>
            <Menu.Item as = {Link} to = '/Usuario'>
                Usuario
            </Menu.Item>
            <Menu.Menu>
                
            </Menu.Menu>
        </Menu>
    );
};