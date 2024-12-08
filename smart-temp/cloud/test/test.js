import app from '../src/server.mjs'; 
import { expect, use } from 'chai';
import chaiHttp from 'chai-http';

const server = use(chaiHttp)

describe('API Endpoints', () => {
  // Test the `/data` endpoint
  describe('GET /data', () => {
    it('should return 400 if value or location is missing', (done) => {
      server.request.execute(app)
        .get('/data')
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.text).to.equal('Missing query parameter "value" or "location"');
          done();
        });
    });

    it('should return 200 and write data successfully to the database', (done) => {
      server.request.execute(app)
        .get('/data?value=25.5&location=kitchen')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('Temperature and location data is valid and Data written successfully to Database!');
          done();
        });
    });
  });

  // Test the `/temp` endpoint
  describe('GET /temp', () => {
    it('should return 200 and return queried data successfully', (done) => {
      server.request.execute(app)
        .get('/temp')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array'); // Expecting an array of data points
          done();
        });
    });
  });
});
