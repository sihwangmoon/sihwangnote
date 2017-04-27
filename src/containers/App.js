import React from 'react';
import {Header} from '../components';
import {connect} from 'react-redux';
import {getStatusRequest} from '../actions/authentication';

class App extends React.Component {

    componentDidMount(){
        function  getCookie(name) {
            var value = "; " + document.cookie;
            var parts = value.split("; "+ name + "=");
            if(parts.length == 2)return parts.pop().split(";").shift();
        }

        let loginData = getCookie('key');

        if(typeof loginData === "undefined") return;

        loginData = JSON.parse(atob(loginData));

        if(!loginData.isLoggedIn) return;

        this.props.getStatusRequest().then(
            () => {
                console.log(this.props.status);

                if(!this.props.status.valid){
                    loginData = {
                        isLoggedIn : false,
                        username :''
                    };

                    document.cookie='key=' + btoa(JSON.stringify(loginData));

                    let $toastContent = $('<span style"color: #FFB4BA">Your session is expired, please log in again</span>');
                    Materialize.toast($toastContent, 4000);
                }
            }
        );
    }
    render() {

        let re = /(login|register)/;
        let isAuth = re.test(this.props.location.pathname);

        return (
            <div>
                {isAuth ? undefined : <Header isLoggedIn={this.props.status.isLoggedIn}/>}
                {this.props.children}
            </div>
        );
    }
}

const mapStateToProps = (state) =>{
    return {
        status: state.authentication.status
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        getStatusRequest: () => {
            return dispatch(getStatusRequest());
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);