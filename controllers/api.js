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
        user_id  uuid DEFAULT uuid_generate_v4 (),
        name     varchar(50) NOT NULL,
        email    varchar(50) NOT NULL,
        password varchar(50) NOT NULL,
        CONSTRAINT PK_5 PRIMARY KEY ( user_id )
        );
        `;
    await pool.query(text);
    res.json("accounts table created");
};

const registerUser = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `
        INSERT INTO accounts (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id
        `;
    const values = [
        req.body.name,
        req.body.email,
        bcrypt.hashSync(req.body.password, 8),
    ];
    await pool.query(text, values);
    console.log("user registered");
};

const verifyLogin = async (req, res) => {
    const pool = new Pool(credentials);
    const text1 = `
        SELECT password FROM accounts WHERE email = $1
        `;
    const text2 = `
        SELECT name FROM accounts WHERE email = $1
        `;
    const values = [req.body.email];
    const passwordHash = await pool.query(text1, values);
    const userName = await pool.query(text2, values);
    const passwordIsValid = bcrypt.compareSync(req.body.password, passwordHash);
    if (passwordIsValid) {
        const token = jwt.sign({ user: userName }, config.secret, {
            expiresIn: 86400,
        });
        res.send({
            success: true,
            message: "Login successful!",
            token: token,
        });
    } else {
        res.send({
            success: false,
            message: "Login failed!",
        });
    }
};

const authToken = async (req, res) => {
    const token = req.headers["access-token"];
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
        CREATE TABLE trip_data
        (
        trip_id   uuid DEFAULT uuid_generate_v4 (),
        user_id   uuid,
        timing      time with time zone NOT NULL,
        distance  integer NOT NULL,
        wait_time integer NOT NULL,
        app       varchar(50) NOT NULL,
        CONSTRAINT PK_14 PRIMARY KEY ( trip_id ),
        CONSTRAINT FK_10 FOREIGN KEY ( user_id ) REFERENCES accounts ( user_id )
        );
        
        CREATE INDEX FK_12 ON trip_data
        (
        user_id
        );
        `;
    await pool.query(text);
    res.json("trip data table created");
};

const newTrip = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `
      INSERT INTO trip_data (timing, distance, wait_time, app)
      VALUES ($1, $2, $3, $4)
      RETURNING trip_id
    `;
    const values = [
        req.body.timing,
        req.body.distance,
        req.body.wait_time,
        req.body.app,
    ];
    pool.query(text, values, (err, result) => {
        if (err) {
            return res.status(401).send({
                message: "newTrip error!",
            });
        }
        res.send({ message: "newTrip success!", id: result.rows[0] });
    });
};

const selectUserTrips = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `SELECT * FROM trip_data WHERE user_id = $1`;
    const values = [req.body.user_id];
    return pool.query(text, values, (err) => {
        if (err) {
            return res.status(401).send({
                message: "selectUserTrips error!",
            });
        }
        res.send({ message: "selectUserTrips success!" });
    });
};

const updateTrip = async (req, res) => {
    const pool = new Pool(credentials);
    const text = `UPDATE trip_data 
                SET timing = $2,
                distance = $3,
                wait_time = $4,
                app = $5
                WHERE trip_id = $1`;
    const values = [
        req.body.trip_id,
        req.body.timing,
        req.body.distance,
        req.body.wait_time,
        req.body.app,
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
    const pool = new Pool(credentials);
    const text = `DELETE FROM trip_data WHERE id = $1`;
    const values = [req.body.trip_id];
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
