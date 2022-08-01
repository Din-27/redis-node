const db = require('mysql')

const pool = db.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database : 'test-samb'
})

function queryDB(query, value)
{
    return new Promise(function(resolve, reject) {
        // The Promise constructor should catch any errors thrown on
        // this tick. Alternately, try/catch and reject(err) on catch.

        pool.query(query, value, function (err, rows, fields) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
            resolve({
                rows,
                fields
            });
        });
    });
}

module.exports = {pool, queryDB}