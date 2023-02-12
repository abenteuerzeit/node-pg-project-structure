// Database access code goes here
// Everywhere else in the application, instead of requiring pg directly, require this file


const { Pool } = require('pg');

const pool = new Pool();

module.exports = {
    async query: (text, params, callback) => {
        // logging for every executed query
        // query parameters are not logged to protect against exposing sensitive information such as encrypted passwords
        const startTime = Date.now();
        return pool.query(text, params, (err, res) => {
            const duration = Date.now() - startTime;
            console.log('executed query', { text, duration, rows: res.rowCount });
            callback(err, res);
        });
    },
    getClient: (callback) => {
        pool.connect((err, client, done) => {
            const query = client.query;

            // monkey patch the query method to keep track of the last query executed
            client.query = (...args) => {
                client.lastQuery = args;
                return query.apply(client, args);
            };

            // set a timeout of 5 seconds, after which we will log this client's last query
            const timeout = setTimeout(() => {
                console.error('A client has been checked out for more than 5 seconds!');
                console.error(`The last executed query on this client was: ${client.lastQuery}`);
            }, 5000);

            const release = (err) => {
                // call the actual 'done' method, returning this client to the pool
                done(err);

                // clear our timeout
                clearTimeout(timeout);

                // set the query method back to its old un-monkey-patched version
                client.query = query;
            };

            callback(err, client, release)
        });
    },
};
