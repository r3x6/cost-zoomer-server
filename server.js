const express = require("express");
const app = express();
const { Pool } = require("pg");
const api = require("./controllers/api");
const port = 5000;

app.use(express.json());

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

// app.post("/horrors/", api.getAllHorrors);
