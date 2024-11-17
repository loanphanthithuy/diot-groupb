console.log('Server starting...');
// 1. Import express and influx client
import express from 'express';
import { InfluxDB, Point} from '@influxdata/influxdb-client';
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

console.log("Connected to InfluxDB");
 
// 4. Define '/data' endpoint
// http://51.120.10.183/api/v1/data?value=26.0 => to database
app.get('/data', async (req, res) => {
    const value = req.query.value;
    if (!value) {
        res.status(400).send('Missing query parameter "value"');
        return;
    }

    try {
        // Log received value
        console.log(`Received value from Pico W: ${value}`);
        // Parse value and write to InfluxDB
        const numeric_value = parseFloat(value);
        const point = new Point("qparams");
        point.floatField("value", numeric_value)
        DB_WRITE_POINT.writePoint(point);
        await DB_WRITE_POINT.flush();
        // Respond to the client
        res.send('OK');
    } catch(err) {
        console.error('Error saving data to InfluxDB:', err.message);
    res.status(500).send('Internal Server Error');
    }
});

// 5. Start the server
app.listen(PORT, HOST, () => {
    console.log(`Cloud API listening at http://${HOST}:${PORT}`);
  });

