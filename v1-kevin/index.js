                                                
const express = require('express');
const bodyParser = require('body-parser');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const app = express();
app.use(bodyParser.json());

// InfluxDB configuration
const influxToken = '9baGgqG7OhNhVw1ZV1rxqpM7_C1hFOvr7Wp2dkEtdTKZgGcZuiTZ5QPcs5otv8NDu5OCxR3Wsc7swra-oTAclQ==';
const influxOrg = 'LAB';
const influxBucket = 'temperature_data';
const influxURL = 'http://localhost:8086';

// Initialize the InfluxDB client
const influxDB = new InfluxDB({ url: influxURL, token: influxToken });
const writeApi = influxDB.getWriteApi(influxOrg, influxBucket);
writeApi.useDefaultTags({ sensor: 'ds18b20' });

// Endpoint to receive temperature data
app.post('/temperature', (req, res) => {
    const { temperature } = req.body;
    
    // Create a new point for InfluxDB
    const point = new Point('temperature')
        .floatField('value', temperature);

    // Write the point to InfluxDB
    writeApi.writePoint(point);
    
    writeApi
        .flush()
        .then(() => res.status(200).send('Data saved to InfluxDB'))
        .catch(err => {
            console.error('Error saving data to InfluxDB', err);
            res.status(500).send('Error saving data to InfluxDB');
        });
});

// Endpoint to GET temperature data
app.get('/temperature', async (req, res) => {
    const queryApi = influxDB.getQueryApi(influxOrg);
    
    const query = `from(bucket: "${influxBucket}")
                   |> range(start: -1h) // get data from the last hour
                   |> filter(fn: (r) => r._measurement == "temperature")
