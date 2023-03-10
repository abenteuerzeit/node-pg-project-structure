// Database access code goes here
// Everywhere else in the application, instead of requiring pg directly, require this file


const { Pool } = require('pg');

const pool = new Pool();

module.exports = {
    async query (text, params) {
        // logging for every executed query
        // query parameters are not logged to protect against exposing sensitive information such as encrypted passwords
        const startTime = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - startTime;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    },
    async getClient () {
        const client = await pool.connect();
        const query = client.query;
        const release = client.release;
        
        // set a timeout of 5 seconds, after which we will log this client's last query
        const timeout = setTimeout(() => {
            console.error('A client has been checked out for more than 5 seconds!');
            console.error(`The last executed query on this client was: ${client.lastQuery}`);
        }, 5000);

        // monkey patch the query method to keep track of the last query executed
        client.query = (...args) => {
            client.lastQuery = args;
            return query.apply(client, args);
        };

        client.release = () => {
            // clear the timeout
            clearTimeout(timeout);
            // set the methods back to their old un-monkey-patched version
            client.query = query;
            client.release = release;
            return release.apply(client);
        }

        return client;
    },
};
