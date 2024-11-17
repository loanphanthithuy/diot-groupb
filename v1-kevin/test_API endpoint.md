# Login to the Azure VM `ssh diotp-vm-influx`

# Test send Data to the server

1.  Run the application on server
    azureuser@diotp-sys:~/temperature-server$ `node index.js`

2.  Send data to the server: Open another terminal window:

azureuser@diotp-sys:~/temperature-server$ `curl -X POST http://localhost:3000/temperature -H "Content-Type: application/json" -d '{"temperature": 25.5}'`

=> the response "Data saved to InfluxDB" if everything is working correctly.

3.  Check sent data on Web UI :

# Add Configuration to the Service File: Copy and paste the following configuration into the service file. Modify it to fit your application's details.

```
[Unit]
Description=Temperature API Server
After=network.target

[Service]
ExecStart=/usr/bin/node /home/YOUR_USERNAME/temperature-server/index.js
Restart=on-failure
User=YOUR_USERNAME
Environment=PATH=/usr/bin:/usr/local/bin
WorkingDirectory=/home/YOUR_USERNAME/temperature-server

[Install]
WantedBy=multi-user.target
```

# file index.js

```
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

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

```

## Already done sending data to InfluxDB and showing in brower

-   http://localhost:8086/
-   http://20.238.12.185/temperature
