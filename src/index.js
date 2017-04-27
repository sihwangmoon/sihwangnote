import React from 'react';
import ReactDOM from 'react-dom';

//router
import {Router, Route, browserHistory, IndexRoute} from 'react-router';
//container components
import {App, Home, Login, Register} from './containers';

//redux
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import reducers from './reducers';
import thunk from 'redux-thunk';

const store = createStore(reducers, applyMiddleware(thunk));

ReactDOM.render(
    <Provider store={store}>
        <Router history={browserHistory}>
            <Route path="/" component={App}>
                <IndexRoute component={Home}/>
                <Route path="home" component={Home}/>
                <Route path="login" component={Login}/>
                <Route path="register" component={Register}/>
            </Route>
        </Router>
    </Provider>,
    document.getElementById('root')
);