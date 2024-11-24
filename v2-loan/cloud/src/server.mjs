console.log('Server starting...');
// 1. Import express and influx client
import express from 'express';
import { InfluxDB, Point, QueryApi} from '@influxdata/influxdb-client';

const app = express();
const HOST = "127.0.0.1";
const PORT = 3000;

// 2. Define a GET endpoint that accepts a "value" query parameter
// app.get('/data', (req, res) => {
//     const value = req.query.value;
//     if (value) {
//         console.log(`Received value from Pico W: ${value}`);
//         res.send(`Value received: ${value}`);
//     } else {
//         res.status(400).send('Missing query parameter "value"');
//     }
// });

// 3. InfluxDB Configuration
const DB_HOST = "http://localhost:8086";
const DB_ORG = "LAB";
const DB_BUCKET = "http-api-data"
const DB_TOKEN = "dP0SVMvWx9g9yhLyinVWgaqXwI7KT9PA2eTjyK0h_LedPN-HGH7QVgTcAyHDnPNZ4UU3tszzq0jsEkuGWzYssA==";

// Initialize InfluxDB Client
const DB_CLIENT = new InfluxDB({
    url: DB_HOST,
    token: DB_TOKEN
});
const DB_WRITE_POINT = DB_CLIENT.getWriteApi(DB_ORG, DB_BUCKET);
DB_WRITE_POINT.useDefaultTags({ app: "query-param-app" });
const QUERY_API = DB_CLIENT.getQueryApi(DB_ORG);

console.log("Connected to InfluxDB");
 
// 4. Define '/data' endpoint to write the Data to DB
// http://51.120.10.183/api/v1/data?value=26.0 => to database // Previously, just 1 sensor
// http://51.120.10.183/api/v1/data?value=25.0&sensorID=sensor_1&location=kitchen
app.get('/data', async (req, res) => {
    const {value, sensorID, location} = req.query.value;
    if (!value || sensorID || !location) {
        res.status(400).send('Missing query parameter "value", "sensorID" or "location"');
        return;
    }

    try {
        // Define the valid temperature range
        const minTemperature = -50; // Example minimum temperature
        const maxTemperature = 50;  // Example maximum temperature

        // Check if the temperature is within the valid range
        if (value < minTemperature || value > maxTemperature) {
            res.status(400).send({ error: 'Invalid temperature value' });
        } else {
            // Log received value
            // console.log(`Received value from Pico W: ${value}`); // with 1 sensor
            console.log(`Received value from sensor ${sensorID} at ${location}: ${value}`);
            // Parse value and write to InfluxDB
            const numeric_value = parseFloat(value);
            const point = new Point("qparams");
            point.tag("sensorID", sensorID)
            point.tag("location", location)
            point.floatField("value", numeric_value)
            DB_WRITE_POINT.writePoint(point);
            await DB_WRITE_POINT.flush();
            // Respond to the client
            res.send('Temperature data is valid and Data written successfully to Database!');
        }
    } catch(err) {
        console.error('Error saving data to InfluxDB!', err.message);
    res.status(500).send('Internal Server Error');
    }
});

// Define endpoint to retrieve the Data

app.get('/temp', async (req, res) => {
    const { sensorID, location } = req.query;
    if (!sensorID || !location) {
        res.status(400).send('Missing query parameters "sensorID" or "location"');
        return;
    }
    const query = `
        from(bucket: "${DB_BUCKET}")
        |> range(start: 0)
        |> filter(fn: (r) => r._measurement == "qparams")
        |> filter(fn: (r) => r._field == "value")
        |> filter(fn: (r) => r.sensorID == "${sensorID}")
        |> filter(fn: (r) => r.location == "${location}")
        |> keep(columns: ["_time", "_value"])
    `;

    try {
        const data = [];
        const rows = await QUERY_API.collectRows(query);
        rows.forEach(row => {
            data.push({ timestamp: row._time, value: row._value, sensorID: row.sensorID, location: row.location });
        });
        res.json(data);
    } catch (err) {
        console.error('Error querying InfluxDB:', err);
        res.status(500).send('Error fetching data from InfluxDB');
    }
});

// 5. Start the server
app.listen(PORT, HOST, () => {
    console.log(`Cloud API listening at http://${HOST}:${PORT}`);
  });
