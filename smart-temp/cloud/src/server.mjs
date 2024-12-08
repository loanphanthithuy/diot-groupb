console.log('Server starting...');
import dotenv from 'dotenv';
dotenv.config();
// 1. Import express and influx client

import express from 'express';
import { InfluxDB, Point} from '@influxdata/influxdb-client';
import { getEnvs } from './envs.mjs';
const ENV = getEnvs();
const app = express();
console.log(ENV.INFLUX.HOST);

// 2. InfluxDB Configuration
const DB_CLIENT = new InfluxDB({
    url: ENV.INFLUX.HOST,
    token: ENV.INFLUX.TOKEN
});
const DB_WRITE_POINT = DB_CLIENT.getWriteApi(
    ENV.INFLUX.ORG,
    ENV.INFLUX.BUCKET
);
DB_WRITE_POINT.useDefaultTags({ app: "db_api" });
const QUERY_API = DB_CLIENT.getQueryApi(ENV.INFLUX.ORG);

console.log("Connected to InfluxDB");

// Middleware to validate temperature range
const validateTemperature = (req, res, next) => {
    const { value } = req.query;
    const numeric_value = parseFloat(value);

    // Validate temperature range
    if (numeric_value < -55 || numeric_value > 125) {
        res.status(400).send('Temperature value out of range. Sensor might be broken.');
        return;
    }

    // Pass control to the next middleware/handler
    next();
};

 
// 3. Define '/data' endpoint to write the Data to DB
app.get('/data', validateTemperature, async (req, res) => {
    const { value, location } = req.query;
    if (!value) {
        res.status(400).send('Missing query parameter "value"');
        return;
    }
    if (!location) {
        res.status(400).send('Missing query parameter "location"');
        return;
    }
    try {
        // Log received parameters
        console.log(`Received data from client - Value: ${value}, Location: ${location}`);

        // Parse `value` as a float
        const numeric_value = parseFloat(value);

        if (isNaN(numeric_value)) {
            return res.status(400).send('"value" must be a valid number.');
        }

        // Create a new point to write to the database
        const point = new Point("qparams")
            .floatField("value", numeric_value) // Store `value` as a numeric field
            .tag("location", location)         // Store `location` as a tag
            .timestamp(new Date());            // Add current timestamp

        // Write the point to the database
        DB_WRITE_POINT.writePoint(point);
        await DB_WRITE_POINT.flush(); // Ensure the data is written immediately
        // Respond to the client
        res.send('Data written successfully to Database!');
    } catch(err) {
        console.error('Error saving data to InfluxDB!', err.message);
    res.status(500).send('Internal Server Error');
    }
});

// Define endpoint to retrieve the Data

app.get('/temp', async (req, res) => {
    const query = `
        from(bucket: "${ENV.INFLUX.BUCKET}")
        |> range(start: 0)
        |> filter(fn: (r) => r._measurement == "qparams")
        |> filter(fn: (r) => r._field == "value")
        |> keep(columns: ["_time", "_value", "location"])
    `;

    try {
        const data = [];
        const rows = await QUERY_API.collectRows(query);
        rows.forEach(row => {
            data.push({
                timestamp: row._time,    // Add timestamp
                value: row._value,      // Add temperature value
                location: row.location  // Add location
            });
        });
        res.json(data);
    } catch (err) {
        console.error('Error querying InfluxDB:', err);
        res.status(500).send('Error fetching data from InfluxDB');
    }
});

// 5. Start the server
app.listen(ENV.PORT, ENV.HOST, () => {
    console.log(`Cloud API listening at http://${ENV.HOST}:${ENV.PORT}`);
  });

