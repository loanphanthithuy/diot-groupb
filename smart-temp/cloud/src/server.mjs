console.log('Server starting...');
// 1. Import express and influx client
import express from 'express';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const app = express();
const HOST = "127.0.0.1";
const PORT = 3001;

// 2. InfluxDB Configuration
const DB_HOST = "http://localhost:8086";
// API ORG, BUCKET, TOKEN from Loan's local
// const DB_ORG = "LAB";
// const DB_BUCKET = "http-api-data"
// const DB_TOKEN = "dP0SVMvWx9g9yhLyinVWgaqXwI7KT9PA2eTjyK0h_LedPN-HGH7QVgTcAyHDnPNZ4UU3tszzq0jsEkuGWzYssA==";

// API ORG, BUCKET, TOKEN from Khoa's local
const DB_ORG = "LAB";
const DB_BUCKET = "db_api";
const DB_TOKEN = "p-TBWodnZyVnpqFH6dM-pdqI4g8o-qbKOrzEwtPXTC2v2hIAajsQWIYuxvYUZSD6fWAlOJ9L16cG1L-N0UqTTw==";

// Initialize InfluxDB Client
const DB_CLIENT = new InfluxDB({
    url: DB_HOST,
    token: DB_TOKEN
});
const DB_WRITE_POINT = DB_CLIENT.getWriteApi(DB_ORG, DB_BUCKET);
DB_WRITE_POINT.useDefaultTags({ app: "query-param-app" });
const QUERY_API = DB_CLIENT.getQueryApi(DB_ORG);

console.log("Connected to InfluxDB");

// 3. Define '/data' endpoint to write the Data to DB
// http://51.120.10.183/api/v1/data?value=26.0 => to database // Previously, for only 1 sensor
// http://51.120.10.183/api/v1/data?value=25.0&location=kitchen // Now, for multiple sensors
app.get('/data', validateTemperature, async (req, res) => {
    const {value, location} = req.query;
    if (!value || !location) {
        res.status(400).send('Missing query parameter "value" or "location"');
        return;
    }
    
    try {
        // Log received value
        // console.log(`Received value from Pico W: ${value}`); // with 1 sensor
        console.log(`Received value at ${location}: ${value}`);
        // Parse value and write to InfluxDB
        const numeric_value = parseFloat(value);
        const point = new Point("qparams");
        point.tag("location", location)
        point.floatField("value", numeric_value)
        DB_WRITE_POINT.writePoint(point);
        await DB_WRITE_POINT.flush();
        // Respond to the client
        res.send('Temperature and location data is valid and Data written successfully to Database!');
    } catch(err) {
        console.error('Error saving data to InfluxDB!', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Middleware function to validate temperature data
function validateTemperature(req, res, next) {
    const {value, location} = req.query;
    if (!value || !location) {
        res.status(400).send('Missing query parameter "value" or "location"');
        return;
    }
    
    const minTemperature = -50; 
    const maxTemperature = 50; 
    
    // Check if the temperature is within the valid range
    if (value < minTemperature || value > maxTemperature) {
        return res.status(400).json({ error: 'Invalid temperature value' });
    }
    
    // If valid, proceed to the next middleware or route handler
    next();
}

// Define endpoint to retrieve the Data

app.get('/temp', async (req, res) => {
    const location  = req.query.location;
    if (!location) {
        res.status(400).send('Missing query parameters "location"');
        return;
    }
    const query = `
    from(bucket: "${DB_BUCKET}")
    |> range(start: 0)
    |> filter(fn: (r) => r._measurement == "qparams")
    |> filter(fn: (r) => r._field == "value")
    |> filter(fn: (r) => r.location == "${location}")
    |> keep(columns: ["_time", "_value", "location"])
    `;
    
    try {
        const data = [];
        const rows = await QUERY_API.collectRows(query);
        rows.forEach(row => {
            data.push({ timestamp: row._time, value: row._value, location: row.location });
        });
        res.json(data);
    } catch (err) {
        console.error('Error querying InfluxDB:', err);
        res.status(500).send('Error fetching data from InfluxDB');
    }
});

// 4. Start the server
app.listen(PORT, HOST, () => {
    console.log(`Cloud API listening at http://${HOST}:${PORT}`);
});

// For Unit Testing
export default app;
