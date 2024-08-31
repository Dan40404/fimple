
import React, {useEffect} from 'react';
import {InputGroup, Form} from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import { LineChart } from '@mui/x-charts/LineChart';
import {STOCKS, STOCKS_CRYPTOS} from "./constants";
import {request_finance, request_login} from "../requests";


function add_blank_asset(wallet_field:any, set_wallet_field:any) {
    let asset_id = -1;

    while (wallet_field['hold'].map((asset:any) => asset.id).includes(asset_id)) {
        asset_id -= 1;
    }

    let new_asset = {"id": asset_id, "state": "HOLD", "short_name": "", "symbol": "", "current_price": 0, "amount": 0, "original_price": 0};
    let new_wallet_field = {...wallet_field};
    new_wallet_field['hold'].push(new_asset);
    set_wallet_field(new_wallet_field);
}


function delete_blank_asset(wallet_field:any, set_wallet_field:any, id:any) {
    set_wallet_field({
        "hold": wallet_field['hold'].filter((asset: any) => asset.id !== id),
        "sold": wallet_field['sold']
    });

}


function get_value_or_placeholder(field:any){
    return (field.value === "" ? (field.placeholder === "" ? field.defaultValue : field.placeholder) : field.value);
}


function Finance({user, set_user,set_is_loading}: {user:any, set_user: any,set_is_loading:any}) {

    function update_wallet(wallet_hold:any, wallet_hold_inputs:any, user:any, set_user:any) {

        // first, we add the assets that the user holds that we might want to update
        let asset_input_element;
        let asset_input_id;
        const asset_input_state = "HOLD";
        let asset_input_symbol;
        let asset_input_amount;
        let asset_input_original_price;

        for (let i = 0; i < wallet_hold.length; i++) {

            asset_input_element = document.getElementById("asset-" + wallet_hold[i].id);
            asset_input_id = wallet_hold[i].id;
            // @ts-ignore
            asset_input_symbol = get_value_or_placeholder(asset_input_element.childNodes[0].childNodes[0]);
            // @ts-ignore
            asset_input_amount = get_value_or_placeholder(asset_input_element.childNodes[2].childNodes[0]);
            // @ts-ignore
            asset_input_original_price = get_value_or_placeholder(asset_input_element.childNodes[4].childNodes[0]);

            request_finance(
                user.token,
                null,
                set_user,
                "update_asset",
                {
                    "id": asset_input_id,
                    "state": asset_input_state,
                    "symbol": asset_input_symbol,
                    "amount": asset_input_amount,
                    "original_price": asset_input_original_price
                }
                );

        }

        // then, we add the assets that the user wants to add

        for (let i = 0; i < wallet_hold_inputs.length; i++) {

            asset_input_element = document.getElementById("asset-input-" + wallet_hold_inputs[i].id);
            asset_input_id = wallet_hold_inputs[i].id;
            // @ts-ignore
            asset_input_symbol = get_value_or_placeholder(asset_input_element.childNodes[0].childNodes[0]);
            // @ts-ignore
            asset_input_amount = get_value_or_placeholder(asset_input_element.childNodes[2].childNodes[0]);
            // @ts-ignore
            asset_input_original_price = get_value_or_placeholder(asset_input_element.childNodes[4].childNodes[0]);

            request_finance(
                user.token,
                null,
                set_user,
                "create_asset",
                {
                    "id": asset_input_id,
                    "state": asset_input_state,
                    "symbol": asset_input_symbol,
                    "amount": asset_input_amount,
                    "original_price": asset_input_original_price
                }
            );

        }

        // we update the wallet and make sure that the user will receive the updated wallet by putting a 1s delay
        setTimeout(() => {request_finance(user.token,user, set_user, 'get_wallet').then(() => {  set_is_loading(false); });}, 1000)

    }

    function sell_asset(asset:any) {

        set_is_loading(true);

        //Create the asset with new data
        let new_asset = {...asset};
        new_asset.state = "SOLD";
        new_asset.transaction_date = new Date().toLocaleString();
        new_asset.transaction_amount = new_asset.current_price * new_asset.amount;


        //edit the wallet
        user.wallet.assets = user.wallet.assets.map((asset:any) => {
            if (asset.id === new_asset.id) {
                return new_asset;
            }
            return asset;
        }
        );

        //update the wallet
        request_finance(user.token, null, set_user, "update_asset", new_asset).then(() => {  set_is_loading(false); });


    }

    function remove_transaction(asset_transaction:any){
        //remove the transaction from the wallet
        set_is_loading(true);

        //request to remove the asset
        request_finance(user.token, null, set_user, "remove_asset", asset_transaction).then(() => {  set_is_loading(false); } );

        //update the wallet
        user.wallet.assets = user.wallet.assets.filter((asset:any) => asset.id !== asset_transaction.id);

    }

    // history capital is the history of the capital of the user to display the evolution of the portfolio with a curve
    let history_capital = user.wallet.history_capital;

    let [portfolio_history, set_portfolio_history] = React.useState(
        history_capital.map((x:any) => {return {date: x.date, value: x.amount}})
    );

    let portfolio_history_x = portfolio_history.map((x:any) => x.date);
    let portfolio_history_y = portfolio_history.map((x:any) => x.value);

    // wallet_assets contains the assets that the user holds and the assets that the user sold
    let wallet_assets = {"hold" : user.wallet, "sold" : user.wallet};
    const [wallet_field, set_wallet_field] = React.useState({"hold" : [], "sold" : []});
    wallet_assets["hold"] = wallet_assets["hold"].assets.filter((asset:any) => asset.state === "HOLD");
    wallet_assets["sold"] = wallet_assets["sold"].assets.filter((asset:any) => asset.state === "SOLD");

    // variables to calculate the total capital and the total profit/loss
    let portfolio_percent;
    let profit_loss;

    // calculate the total profit/loss and the total capital
    let total_profit_loss = wallet_assets['hold'].map((asset:any) => { return (asset.current_price - asset.original_price) * asset.amount; });
    total_profit_loss = total_profit_loss.reduce((a:any, b:any) => a + b, 0);
    total_profit_loss = total_profit_loss.toFixed(2);

    let total_capital = wallet_assets['hold'].map((asset:any) => { return asset.current_price * asset.amount; });
    total_capital = total_capital.reduce((a:any, b:any) => a + b, 0);
    total_capital = total_capital.toFixed(2);

    return (
        <div className={"finance"}>

            <div className={"finance-left"}>

                <Alert key={"primary"} variant={"primary"} style={{fontSize: '25px',fontFamily: 'sans-serif',fontStyle: 'normal',marginTop: '20px',width: '100%'}}>
                Your total Capital $ : ${total_capital}
                </Alert>

                <Alert key={"info"} variant={"info"} style={{fontSize: '25px',fontFamily: 'sans-serif',fontStyle: 'normal',marginTop: '20px',width: '100%'}}>
                Your total P&L (Profit and Loss) : ${total_profit_loss}
                </Alert>

                <div className={"horizontal"} style={{width: '100%',height: '1px',backgroundColor: 'black',marginTop: '20px'}}></div>

                <div className={"possessions"} style={{marginTop: '20px'}}>

                    <p style={{fontSize: '25px',fontFamily: 'sans-serif',fontStyle: 'normal',marginTop: '20px',width: '100%'}}>Your possessions</p>

                    <Table striped bordered hover variant="dark" style={{marginTop: '20px'}}>
                        <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Current Value</th>
                            <th>Amount</th>
                            <th>Value ($)</th>
                            <th>Original Price ($)*</th>
                            <th>Profit/Loss ($)</th>
                            <th>Portfolio (%)</th>
                            <th>Sell Button</th>
                        </tr>
                        </thead>
                        <tbody>


                        {
                            //ASSETS THAT THE USER HOLDS
                            wallet_assets['hold'].map((asset:any) => {

                            profit_loss = (asset.current_price - asset.original_price) * asset.amount;
                            profit_loss = profit_loss.toFixed(2);

                            portfolio_percent = (asset.current_price * asset.amount) / history_capital[history_capital.length - 1].amount;
                            portfolio_percent = portfolio_percent * 100;
                            portfolio_percent = portfolio_percent.toFixed(2);

                            return (
                                <tr id={"asset-" + asset.id}>

                                    <td><Form.Select aria-label="Symbol" defaultValue={asset.symbol} >
                                        {STOCKS_CRYPTOS.map((stock:any) => {
                                            return (
                                                <option value={stock}>{stock}</option>
                                            )
                                        }
                                        )}
                                       </Form.Select>
                                    </td>
                                    <td>${asset.current_price}</td>
                                    <td><Form.Control aria-label="Amount" type="text" placeholder={asset.amount}/></td>
                                    <td> ${(asset.current_price * asset.amount).toFixed(2)}</td>
                                    <td><Form.Control aria-label="Oprice" type="text" placeholder={asset.original_price}/></td>
                                    <td>${profit_loss}</td>
                                    <td>{portfolio_percent}%</td>
                                    <td><Button variant="danger" onClick={() => sell_asset(asset)}>
                                        Sell
                                    </Button></td>
                                </tr>
                            )
                        }
                        )}

                        {
                            //ASSETS THAT THE USER WANTS TO ADD
                            wallet_field['hold'].map((asset:any) => {

                            profit_loss = 0;
                            portfolio_percent = 0;

                            return (
                                <tr id={"asset-input-"+asset.id}>

                                    <td><Form.Select aria-label="Symbol" defaultValue={asset.symbol} >
                                        {STOCKS_CRYPTOS.map((stock:any) => {
                                            return (
                                                <option value={stock}>{stock}</option>
                                            )
                                        }
                                        )}
                                        </Form.Select>
                                    </td>
                                    <td>${asset.current_price}</td>
                                    <td><Form.Control aria-label="Amount" type="text" placeholder={asset.amount} onChange={(e) => { asset.amount = e.target.value; }}/></td>
                                    <td>${(asset.current_price * asset.amount).toFixed(2)}</td>
                                    <td><Form.Control aria-label="Oprice" type="text" placeholder={asset.original_price } onChange={(e) => { asset.original_price = e.target.value; }}/></td>
                                    <td>${profit_loss}</td>
                                    <td>{portfolio_percent}%</td>
                                    <td><Button variant="danger" className={asset.id} onClick={() => delete_blank_asset(wallet_field, set_wallet_field, asset.id)}>
                                        <img style={{width: '20px', height: '20px'}} src={"https://cdn-icons-png.flaticon.com/512/5016/5016735.png"}/>
                                    </Button></td>
                                </tr>
                            )
                        }
                        )}

                        </tbody>

                    </Table>

                    <Button variant="primary" style={{width: "10%"}} onClick={() => add_blank_asset(wallet_field, set_wallet_field)}>
                        +
                    </Button>{' '}
                    <Button variant="primary" style={{width: "10%"}} onClick={
                        () => {
                            set_is_loading(true);
                            update_wallet(wallet_assets['hold'], wallet_field['hold'], user, set_user);
                        }
                    }
                        >
                        <img style={{width: '20px', height: '20px'}} src={"https://cdn-icons-png.flaticon.com/512/7063/7063204.png"}/>
                    </Button>{' '}

                    <p style={{
                        fontSize: '15px',
                        fontFamily: 'sans-serif',
                        fontStyle: 'italic',
                        marginTop: '20px',
                        width: '100%'
                    }}>
                        *Original Value is the value of the asset when you bought it
                    </p>

                </div>

            </div>

            <div className={"finance-right"}>
                <p style={{
                    fontSize: '25px',
                    fontFamily: 'sans-serif',
                    fontStyle: 'normal',
                    marginTop: '20px',
                    width: '100%'
                }}>Portfolio Evolution</p>

                <div className={"chart"}>
                    <LineChart
                        height={300}
                        margin={{top: 10, right: 50, bottom: 10, left: 50}}
                        colors={['rgba(0,72,255,0.63)']}
                        series={[
                            {data: portfolio_history_y, label: 'value'},
                        ]}
                        xAxis={[{scaleType: 'point', data: portfolio_history_x}]}
                    />
                </div>

                <div className={"horizontal"} style={{width: '100%', height: '1px', backgroundColor: 'black', marginTop: '20px'}}></div>

                <p style={{
                    fontSize: '25px',
                    fontFamily: 'sans-serif',
                    fontStyle: 'normal',
                    marginTop: '20px',
                    width: '100%'
                }}>Transactions</p>

                <Table striped bordered hover variant="dark" style={{marginTop: '20px'}}>
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Asset</th>
                        <th>Symbol</th>
                        <th>Transaction Amount ($)</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>

                    {wallet_assets['sold'].map((asset:any) => {
                        return (
                            <tr id={asset.id}>
                                <td>{asset.transaction_date}</td>
                                <td>{asset.short_name}</td>
                                <td>{asset.symbol}</td>
                                <td>Sold ${asset.transaction_amount} of {asset.short_name}</td>
                                <td>
                                    <Button variant="danger" onClick={() => { remove_transaction(asset) } }>
                                        <img style={{width: '20px', height: '20px'}} src={"https://cdn-icons-png.flaticon.com/512/5016/5016735.png"}/>
                                    </Button>
                                </td>
                            </tr>
                        )
                        }
                    )}

                    </tbody>
                </Table>


            </div>


        </div>
    );
}

export default Finance;