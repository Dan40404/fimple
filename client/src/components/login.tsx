import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {request_login} from "../requests";
import * as timers from "node:timers";



function Login({user,set_user,set_is_loading}: {user:any,set_user: any,set_is_loading:any}) {

    const submit = (e: { preventDefault: () => void; }) => {
        set_is_loading(true);
        e.preventDefault();
        // @ts-ignore
        const email = document.getElementById('email').value;
        // @ts-ignore
        const password = document.getElementById('password').value;
        request_login(null, set_user, email, password).then(() => { set_is_loading(false); });

    }

  return (
    <div className="login" style={{width: '70%', margin: 'auto',justifyContent: 'center', alignItems: 'center',marginTop:'10%'}}>

        <Form >
            <Form.Group controlId="formBasicEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="text" placeholder="Enter email" id={"email"} />
            </Form.Group>

            <Form.Group controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password" id={"password"} />
            </Form.Group>

            <Button variant="primary" type="submit" style={{ marginTop: '20px'}} onClick={submit}>
            Submit
            </Button>
        </Form>

    </div>
  );
}


export default Login;
