# pnm_hospitalPharmacyCollection
The project is an example application showcasing data processing and database integration.

## Overview
This project demonstrates how to use Node.js to read and process CSV files, and store the data in a MySQL database. It also provides best practices for data transformation, asynchronous task management, and database querying and updates.

## Features
- CSV file reading and parsing
- Data transformation and manipulation
- Integration with MySQL database
- Asynchronous task management
- Database querying and updates

## Installation and Execution

1. Clone this repository:

   ```bash
   git clone https://github.com/tmdgns107/pnm_hospitalPharmacyCollection.git

2. Install the required dependencies:

   ```bash
   npm install

3. Modify the db.config.json file to configure the database connection:

   ```bash
   {
     "host": "database_host",
     "user": "database_user",
     "password": "database_password",
     "port": "database_port",
     "database": "database_name"
   }

4. Prepare your CSV file and update the file path and other settings in the index.js file.

5. Run the project:

   ```bash
   npm start

