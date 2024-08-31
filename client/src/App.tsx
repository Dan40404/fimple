import React from 'react';
import logo from './logo.svg';
import './App.css';
import Login from "./components/login";
import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Finance from "./components/finance";
import Predictions from "./components/predictions";

function App_title() {
    return (
        <p className={"App-title"} style={{marginTop: '2%'}}>
            Fimple
        </p>
    )
}


function Loading() {
    return (
        <div className="App">
            <App_title />
            <img src={"https://media.lordicon.com/icons/wired/lineal/2531-recurring-cash.gif"} alt="logo" />
        </div>
    )
}


function App() {

  const [user, set_user] = React.useState({email: '', password: '', is_logged_in: 0});
  const [is_loading, set_is_loading] = React.useState(false);
  const [tabs, set_tabs] = React.useState("finance");
  const [screen_width, set_screen_width] = React.useState(window.innerWidth);
  let user_name = "";

    React.useEffect(() => {
        window.addEventListener('resize', () => {
        set_screen_width(window.innerWidth);
        });
    }
    , []);

    if (screen_width <1440) {
        return (
            <div className="App">
                <App_title />
                <p style={{marginTop: '2%', fontSize: '20px'}}>
                    This app is not optimized for mobile devices. Please use a desktop or a laptop.
                </p>
            </div>
        )
    }


  if (is_loading) {
    return (
        <Loading />
    )
}

  if (user.is_logged_in === 1) {

      user_name = user.email.split('@')[0];
      user_name = user_name.charAt(0).toUpperCase() + user_name.slice(1);

    return (
        <div className="App">
            <Nav fill variant="tabs" defaultActiveKey="finance">
                <Nav.Item>
                    <Nav.Link eventKey={"finance"} style={{fontSize: '20px'}} onClick={() => set_tabs("finance")}>My Finances</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey={"predictions"} style={{fontSize: '20px'}} onClick={() => set_tabs("predictions")}>Predictions Calculator</Nav.Link>
                </Nav.Item>
            </Nav>



        <p className={"App-title"} style={{marginTop: '2%', fontSize: '30px'}}>
            Welcome to Fimple {user_name} ! - {(tabs === "finance") ? "My Finances" : "Predictions Calculator"}
        </p>

            {(tabs === "finance") ? <Finance user={user} set_user={set_user} set_is_loading={set_is_loading}/> : <Predictions user={user} set_user={set_user} set_is_loading={set_is_loading}/>}

        </div>
    );
  }

  return (
      <div className="App">
        <App_title />
            <Login user={user} set_user={set_user} set_is_loading={set_is_loading}/>
        </div>
  )


}
export default App;
