import React, { Component } from 'react';
import { Container} from 'semantic-ui-react';
import { Switch, Route } from 'react-router-dom';
import Header from './components/Header';
import Who from './pages/Who';
import Lab from './pages/Lab';
import User from './pages/User';
import 'semantic-ui-css/semantic.min.css';

class App extends Component {

    render() {
            return (
                <Container>
                    <Header />
                    <main>
                        <Switch>
                            <Route exact path='/' component={Who}/>
                            <Route exact path = '/Laboratorio' component={Lab}/>
                            <Route exact path = '/Usuario' component={User}/>
                        </Switch>
                    </main>
                </Container>
            );
    }
}

export default App;
