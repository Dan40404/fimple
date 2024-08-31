import {
    a,
    d
} from "../../../../AppData/Local/Packages/PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0/LocalCache/local-packages/Python312/site-packages/playwright/driver/package/lib/vite/traceViewer/assets/testServerConnection-JQMZFCzK";

const baseUrl = 'http://127.0.0.1:8000/fimpleAPI/';

async function request_login(token:any, set_user:any, email:any, password:any) {
    var url = (token != null) ? new URL(baseUrl + 'login/') : new URL(baseUrl + 'login_with_email/');

    await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'token' : token,
            'email' : email,
            'password' : password,
        },
    }).then(response => response.json())
        .then(data => {
            let token = data.user.token;
            request_finance(token,data.user, set_user, 'get_wallet');

        }
        )
        .catch((error) => {
            console.error('Error:', error,error.message, error.name,error.response,error.request);
        });
}


async function request_finance(token:any,data_user:any, set_user:any, action:any, asset:any = null) {


    var url = new URL(baseUrl + 'finance/');

    if (action.includes('get')) {

        await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'token': token,
                'action': action,
            },
        }).then(response => response.json())
            .then(finance_data => {
                data_user.wallet = finance_data.wallet;
                data_user.is_logged_in = 1;
                set_user(data_user);
                }
            )
            .catch((error) => {
                console.error('Error:', error, error.message, error.name, error.response, error.request);
            });

    }


    else{
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': token,
                'action': action,
            },
            body: JSON.stringify({
                asset: asset,
                asset_id: asset.id,
            })
        }).then(response => response.json())
            .then(response_data => {
                if (action=== "create_asset" && response_data['success'] === false) {
                    alert("Asset "+asset.name+" could not be created. Please try again.");
                }
                }
            )
            .catch((error) => {
                console.error('Error:', error, error.message, error.name, error.response, error.request);
            });
    }

}


async function request_prediction(token:any,base_capital:any,assets:any,reinvestment_rate:any,years:any,mensual_intake:any,mensual_intakes:any,results:any,set_results:any) {
    var url = new URL(baseUrl + 'prediction/');

    if (mensual_intakes === null) {
        mensual_intakes = [];
    }

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': token,
        },
        body: JSON.stringify({
            base_capital: base_capital,
            assets: assets,
            reinvestment_rate: reinvestment_rate,
            years: years,
            mensual_intake: mensual_intake,
            mensual_intakes: mensual_intakes,
        })
    }).then(response => response.json())

        .then(prediction_data => {

            let new_results = [];
            for (let i = 0; i < prediction_data['predictions'].length; i++) {
                new_results.push(prediction_data['predictions'][i]);
            }

            set_results(new_results);
        }

        )
        .catch((error) => {
            console.error('Error:', error,error.message, error.name,error.response,error.request);
        });

}

export {request_login, request_finance, request_prediction};