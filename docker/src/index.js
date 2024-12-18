const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
	res.send("Hello, Docker!");
});

app.get("/external-api", async (req, res) => {
	const address = "http://external-api:9000/products";
	const response = await fetch(address);
	const data = await response.json();
	res.send(data);
});

app.get("/test-db", async (req, res) => {
	const mysql = require("mysql2");

	const connection = mysql.createConnection({
		host: "db",
		user: "root",
		password: "root",
		database: "my_database",
	});
	connection.connect();
	res.send("Connected to MySQL database");
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
