import Alert from "react-bootstrap/Alert";
import React, {useState} from "react";
import {InputGroup, Form} from "react-bootstrap";
import Slider from "@mui/material/Slider";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
import {STOCKS_CRYPTOS} from "./constants";
import {request_prediction} from "../requests";

function Predictions({user, set_user, set_is_loading}: {user:any, set_user: any, set_is_loading:any}) {

    const [reinvestment_rate, set_reinvestment_rate] = React.useState<number[]>([20]);
    const [years, set_years] = React.useState<number[]>([1]);
    const [base_capital, set_base_capital] = React.useState<number[]>([0]);
    const [mensual_intake, set_mensual_intake] = React.useState<number[]>([0]);
    const [predictions_assets, set_predictions_assets] = React.useState([]);
    const [results, set_results] = React.useState([]);
    let reinvested = 0;
    let profit = 0;

    const handleChange = (event: Event, newValue: number | number[]) => {
        set_reinvestment_rate(newValue as number[]);
    };


    const add_prediction_asset = () => {
        // @ts-ignore
        let asset = {id: (predictions_assets.length !== 0) ? predictions_assets[predictions_assets.length - 1].id + 1 : 0,
            symbol: "SYM", interest: 0, intake: 0, intake_dollars: 0};
        // @ts-ignore
        set_predictions_assets([...predictions_assets, asset]);
    }


    const remove_prediction_asset = (id: number) => {
        let new_assets = predictions_assets.filter((asset: any) => asset.id !== id);
        set_predictions_assets(new_assets);
    }


    const update_attribute = (id: number, attribute: string, value: any) => {
        let new_assets = predictions_assets.map((asset: any) => {
            if (asset.id === id) {
                if (attribute === 'symbol') {
                    asset.symbol = value;
                }
                else if (attribute === 'interest') {
                    asset.interest = value;
                }
                else if (attribute === 'intake') {
                    asset.intake = value;
                    let intake_percent = value / 100;
                    // @ts-ignore
                    asset.intake_dollars = mensual_intake * intake_percent;
                }
            }
            return asset;
        });
        // @ts-ignore
        set_predictions_assets(new_assets);
    }


    const update_every_asset_intake = (new_mensual_intake: any) => {
        let new_assets = predictions_assets.map((asset: any) => {
            let intake_percent = asset.intake / 100;
            // @ts-ignore
            asset.intake_dollars = new_mensual_intake * intake_percent;
            return asset;
        });
        // @ts-ignore
        set_predictions_assets(new_assets);
    }


    const make_predictions = () => {

        request_prediction(
            user.token,
            base_capital[0],
            predictions_assets,
            (reinvestment_rate[0] === undefined) ? reinvestment_rate : reinvestment_rate[0],
            years[0],
            mensual_intake[0],
            null,
            results,
            set_results
        );
    }


    // @ts-ignore
    return (
        <div >
        <Button variant="primary" style={{margin:"auto", width: "50%",marginTop: '25px'}} onClick={make_predictions}
        >
            Calculate
        </Button>{' '}

        <div className={"predictions"}>

        <div className={"predictions-left"}>

            <InputGroup className="mb-3">
                <InputGroup.Text>Base Capital</InputGroup.Text>
                <Form.Control aria-label="Amount (to the nearest dollar)" style={{fontSize: '20px'}} type={"number"}
                              maxLength={10} onChange={(e) => set_base_capital([parseInt(e.target.value)])}/>
                <InputGroup.Text>$</InputGroup.Text>
            </InputGroup>

            <InputGroup className="mb-3">
                <InputGroup.Text>Mensual Intake</InputGroup.Text>
                <Form.Control aria-label="Amount (to the nearest dollar)" style={{fontSize: '20px'}} type={"number"}
                              maxLength={10} onChange={(e) => { set_mensual_intake([parseInt(e.target.value)]) ; update_every_asset_intake(parseInt(e.target.value))} }/>
                <InputGroup.Text>$</InputGroup.Text>
            </InputGroup>

            <Form.Label style={{fontSize: '20px', marginTop: '20px'}}>Reinvestment Rate - {reinvestment_rate}%</Form.Label>
            <Slider
                aria-label="Custom marks"
                defaultValue={20}
                getAriaValueText={(value) => `${value}%`}
                step={0.1}
                valueLabelDisplay="auto"
                onChange={handleChange}
                marks={[{value: 0, label: '0%'}, {value: 100, label: '100%'}]}
            />

            <Table striped bordered hover variant="dark" style={{marginTop: '20px'}}>

                <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Annual Return % (1-100)</th>
                    <th>Mensual Intake % (1-100)</th>
                    <th>Mensual Intake $</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>

                {predictions_assets.map((asset: any) => (
                    <tr id={asset.id}>
                        <td><Form.Select aria-label="Symbol" defaultValue={asset.symbol} onChange={(e) => update_attribute(asset.id, 'symbol', e.target.value)}>
                            {STOCKS_CRYPTOS.map((stock: any) => {
                                    return (
                                        <option value={stock}>{stock}</option>
                                    )
                                }
                            )}
                        </Form.Select>
                        </td>
                        <td><Form.Control type="number" defaultValue={asset.interest} onChange={(e) => update_attribute(asset.id, 'interest', e.target.value)}/></td>
                        <td><Form.Control type="number" defaultValue={asset.intake} onChange={(e) => update_attribute(asset.id, 'intake', e.target.value)}/></td>
                        <td>{asset.intake_dollars}</td>
                        <td>
                            <Button variant="danger" onClick={() => {remove_prediction_asset(asset.id)}}>
                                <img style={{width: '20px', height: '20px'}}
                                     src={"https://cdn-icons-png.flaticon.com/512/5016/5016735.png"}/>
                            </Button>
                        </td>
                    </tr>
                ))
                }

                </tbody>

            </Table>

            <Button variant="primary" style={{width: "10%"}} onClick={add_prediction_asset}>
                +</Button>{' '}

        </div>

            <div className={"predictions-right"}>

                <Tab.Container id="tabs-container" defaultActiveKey="first">
                    <Nav variant="pills" className="flex-row">
                        <Nav.Item>
                            <Nav.Link eventKey="first" onClick={() => set_years([1])}>1 Y</Nav.Link>
                            </Nav.Item>
                            <Nav.Item >
                                <Nav.Link eventKey="second" onClick={() => set_years([2])}>2 Y</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="fifth" onClick={() => set_years([5])}>5 Y</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="tenth" onClick={() => set_years([10])}>10 Y</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="twenty" onClick={() => set_years([20])}>20 Y</Nav.Link>
                            </Nav.Item>

                        </Nav>
            </Tab.Container>

            <Table striped bordered hover variant="dark" style={{marginTop: '20px'}}>

                <thead>
                <tr>
                    <th>Year</th>
                    <th>Gain</th>
                    <th>Reinvestment</th>
                    <th>Profit</th>
                </tr>
                </thead>
                <tbody>

                {results.map((result: any, index: number) => {
                    console.log("result", result);
                    // @ts-ignore
                    reinvested = (result.toFixed(2) * (reinvestment_rate[0] === undefined ? reinvestment_rate : reinvestment_rate[0]) / 100);
                    profit = result - reinvested;
                    return (
                    <tr id={index.toString()}>
                        <td>{index + 1}</td>
                        <td>{result.toFixed(2)}</td>
                        <td>{reinvested.toFixed(2)}</td>
                        <td>{profit.toFixed(2)}</td>
                    </tr>
                    )
                }
                )}

                </tbody>

            </Table>
        </div>

        </div>

        </div>
    )
}

export default Predictions;