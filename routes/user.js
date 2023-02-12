// Require the db adapter file and not node-postgres directly

const db = require('../db');

app.get('/:id', function(request, response, next) {
    db.query('SELECT * FROM users WHERE id = $1', [request.params.id], function(error, result) {
        if (error) {
            return next(error);
        }
        response.status(200).send(result.rows[0])
    });
});

// other routes
