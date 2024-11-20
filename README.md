# IoT Temperature Monitoring System

## Overview
The **IoT Temperature Monitoring System** is a web application that collects, stores, and visualizes temperature data from IoT devices. The system includes a temperature sensor, a backend API to handle data ingestion and querying, a database for storage, and a user-friendly interface to display real-time temperature readings and historical data trends.

---

## Features
- **IoT Sensor Simulation**: Sends temperature readings to the backend API periodically.
- **API Endpoint**: Receives and stores temperature data in an InfluxDB database.
- **Data Visualization**: Displays real-time temperature and historical trends in a simple web interface.
- **Scalable Backend**: Built with Node.js and Express.js for efficient data handling.
- **Frontend Integration**: Uses Chart.js to provide interactive charts.

---

## Technology Stack
- **Frontend**: 
  - HTML, CSS, JavaScript
  - Chart.js for data visualization

- **Backend**:
  - Node.js with Express.js
  - RESTful API design
  - InfluxDB for time-series data storage

- **DevOps**:
  - Nginx for reverse proxy and (CORS management for testing locally)
  - Systemd for service management
  - Git for version control

---

## Installation

### Prerequisites
- Node.js (v2x recommended)
- InfluxDB
- Git
- Nginx

### Steps to Set Up

1. **Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/<your-repository>.git
   cd <your-repository>
