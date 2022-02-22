const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/auth");

const credentials = {
    user: "db_user",
    host: "localhost",
    database: "costzoomer",
    password: null,
    port: 5432,
};

// APIs

const prepareRegister = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `
        CREATE TABLE IF NOT EXISTS accounts
        (
        user_id  uuid DEFAULT gen_random_uuid (),
        name     varchar(50) NOT NULL,
        email    varchar(50) NOT NULL,
        password varchar(60) NOT NULL,
        CONSTRAINT PK_5 PRIMARY KEY ( user_id )
        );
        `;
    await pool.query(text);
    res.send("accounts table created");
};

const registerUser = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `
        INSERT INTO accounts (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING user_id
        `;
    const values = [
        req.body.name,
        req.body.email,
        bcrypt.hashSync(req.body.password, 8),
    ];
    await pool.query(text, values);
    res.send("user registered");
};

const verifyLogin = async (req, res) => {
    const pool = new Pool(credentials);
    const text1 = `
        SELECT password FROM accounts WHERE email = $1
        `;
    const text2 = `
        SELECT name FROM accounts WHERE email = $1
        `;
    const text3 = `
        SELECT user_id FROM accounts WHERE email = $1
        `;
    const values = [req.body.email];
    const passwordHash = await pool.query(text1, values);
    const userName = await pool.query(text2, values);
    const userId = await pool.query(text3, values);
    const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        passwordHash.rows[0].password
    );
    if (passwordIsValid) {
        const token = jwt.sign({ user: userName.rows[0].name }, config.secret, {
            expiresIn: 3600,
        });
        res.send({
            success: true,
            message: "Login successful!",
            token: token,
            userId: userId.rows[0].user_id,
        });
    } else {
        res.send({
            success: false,
            message: "Login failed!",
        });
    }
};

const authToken = async (req, res) => {
    const token = req.body.token;
    if (!token) {
        return res.status(403).send({
            message: "No token provided!",
        });
    }
    jwt.verify(token, config.secret, (err) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized!",
            });
        }

        res.send({ message: "Authenticated!" });
    });
};

const prepareMyTrips = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `
        CREATE TABLE IF NOT EXISTS trip_data
        (
        trip_id   uuid DEFAULT gen_random_uuid (),
        user_id   uuid NOT NULL,
        timing    varchar(200) NOT NULL,
        distance  integer NOT NULL,
        wait_time integer NOT NULL,
        app       varchar(50) NOT NULL,
        cost       money NOT NULL,
        CONSTRAINT PK_14 PRIMARY KEY ( trip_id ),
        CONSTRAINT FK_10 FOREIGN KEY ( user_id ) REFERENCES accounts ( user_id )
        );
        CREATE INDEX IF NOT EXISTS FK_12 ON trip_data
        (
        user_id
        );
        `;
    await pool.query(text);
    res.json("trip data table created");
};

const newTrip = async (req, res) => {
    console.log(req.body);
    const pool = new Pool(credentials);

    const text = `
      INSERT INTO trip_data (user_id, timing, distance, wait_time, app, cost)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    const values = [
        req.body.userId,
        req.body.timing,
        req.body.dist,
        req.body.time,
        req.body.app,
        req.body.cost,
    ];
    pool.query(text, values, (err, result) => {
        if (err) {
            return res.status(401).send({
                message: err,
            });
        }
        res.send({ message: "newTrip success!", id: result });
    });
};

const selectUserTrips = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `SELECT * FROM trip_data WHERE user_id = $1`;
    const values = [req.body.userId];
    return pool.query(text, values, (err, result) => {
        if (err) {
            return res.status(401).send({
                message: "selectUserTrips error!",
            });
        }
        res.send({ message: "selectUserTrips success!", data: result.rows });
    });
};

const updateTrip = async (req, res) => {
    console.log(req.body);
    const pool = new Pool(credentials);
    const text = `UPDATE trip_data 
                SET timing = $2,
                distance = $3,
                wait_time = $4,
                app = $5,
                cost = $6
                WHERE trip_id = $1`;
    const values = [
        req.body.tripId,
        req.body.timing,
        req.body.dist,
        req.body.time,
        req.body.app,
        req.body.cost,
    ];
    return pool.query(text, values, (err) => {
        if (err) {
            return res.status(401).send({
                message: "updateTrip error!",
            });
        }
        res.send({ message: "updateTrip success!" });
    });
};

const deleteTrip = async (req, res) => {
    console.log(req.body.tripId);
    const pool = new Pool(credentials);
    const text = `DELETE FROM trip_data WHERE trip_id = $1`;
    const values = [req.body.tripId];
    return pool.query(text, values, (err) => {
        if (err) {
            return res.status(401).send({
                message: "deleteTrip error!",
            });
        }
        res.send({ message: "deleteTrip success!" });
    });
};

// Export APIs

module.exports = {
    prepareRegister,
    registerUser,
    verifyLogin,
    authToken,
    prepareMyTrips,
    newTrip,
    selectUserTrips,
    updateTrip,
    deleteTrip,
};
