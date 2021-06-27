import React from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export default () => {

    return (
        <Menu stackable style={{ marginTop: '10px' }}>
            <Menu.Item as = {Link} to = '/'>
                Organización Mundial de la Salud
            </Menu.Item>
            <Menu.Menu>
                <Menu.Item as = {Link} to = '/Laboratorio'>
                    Laboratorio
                </Menu.Item>
                <Menu.Item as = {Link} to = '/Usuario'>
                    Usuario
                </Menu.Item>
            </Menu.Menu>
        </Menu>
    );
};