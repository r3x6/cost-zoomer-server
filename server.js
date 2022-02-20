const express = require("express");
const app = express();
const { Pool } = require("pg");
const api = require("./controllers/api");
const port = 5000;
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const credentials = {
    user: "db_user",
    host: "localhost",
    database: "costzoomer",
    password: null,
    port: 5432,
};

// Connect with a connection pool.

async function connectPool() {
    const pool = new Pool(credentials);
    const now = await pool.query("SELECT NOW()");
    await pool.end();

    return now;
}

// Use a self-calling function so we can use async / await.

(async () => {
    const poolResult = await connectPool();
    console.log("Time with pool: " + poolResult.rows[0]["now"]);
})();

app.listen(port, () => {
    console.log(`CostZoomer server is running on port ${port}.`);
});

app.post("/prepareregister", api.prepareRegister);
app.post("/registeruser", api.registerUser);
app.post("/verifylogin", api.verifyLogin);
app.post("/authtoken", api.authToken);
app.post("/preparemytrips", api.prepareMyTrips);
app.post("/newtrip", api.newTrip);
app.post("/updatetrip", api.updateTrip);
app.post("/deletetrip", api.deleteTrip);
